import { PathFn } from './path';
import { TimingFn } from './timing';
import { TickerFn } from './ticker';
import { AnimationBase } from './base';
import { has } from './utils';

export type AnimateFn = (e: Animation, type: AnimateHook) => void;

export type AnimateType = 'move' | 'rotate' | 'resize' | 'shake';

export type AnimateTime = 'start' | 'end' | 'running';

/**
 * 动画生命周期钩子
 */
export type AnimateHook =
    | `${AnimateType}${AnimateTime}`
    | AnimateType
    | AnimateTime;

export interface AnimateTargets {
    system: {
        move: [x: number, y: number];
        moveAs: [x: number, y: number];
        rotate: number;
        resize: number;
        shake: 0;
    };
    custom: Record<string, number>;
}

export interface AnimateTickers {
    system: {
        move: [TickerFn, TickerFn];
        moveAs: TickerFn;
        rotate: TickerFn;
        resize: TickerFn;
        shake: TickerFn;
    };
    custom: Record<string, TickerFn>;
}

export interface AnimationBaseLike {
    x: number;
    y: number;
    size: number;
    angle: number;
    custom: Record<string, number>;
}

export class Animation extends AnimationBase<AnimateHook> {
    /** 震动变化函数 */
    shakeTiming: TimingFn;
    /** 根据路径移动时的路径函数 */
    path: PathFn;

    /** 自定义的动画属性 */
    value: Record<string, number> = {};
    /** 放缩的大小 */
    size: number = 1;
    /** 角度 */
    angle: number = 0;

    /** 各个动画的目标值 */
    private readonly targetValue: AnimateTargets = {
        system: {
            move: [0, 0],
            moveAs: [0, 0],
            resize: 0,
            rotate: 0,
            shake: 0
        },
        custom: {}
    };
    /** 动画的帧函数 */
    private readonly animateFn: AnimateTickers = {
        system: {
            move: [() => 0, () => 0],
            moveAs: () => 0,
            resize: () => 0,
            rotate: () => 0,
            shake: () => 0
        },
        custom: {}
    };

    get x(): number {
        return this.ox + this.sx;
    }

    get y(): number {
        return this.oy + this.sy;
    }

    // 无震动时的坐标
    protected ox: number = 0;
    protected oy: number = 0;
    // 震动时的坐标
    private sx: number = 0;
    private sy: number = 0;

    constructor() {
        super();
        this.timing = n => n;
        this.shakeTiming = n => n;
        this.path = n => [n, n];
        this.applying = {
            move: false,
            scale: false,
            rotate: false,
            shake: false
        };
        // animating listener
        this.ticker.add(() => {
            const { running } = this.listener;
            if (has(running)) {
                for (const fn of running) {
                    fn(this, 'running');
                }
            }
        });
    }

    mode(fn: TimingFn, shake: boolean = false): Animation {
        if (shake) this.shakeTiming = fn;
        else this.timing = fn;
        return this;
    }

    time(time: number): Animation {
        this.easeTime = time;
        return this;
    }

    relative(): Animation {
        this.relation = 'relative';
        return this;
    }

    absolute(): Animation {
        this.relation = 'absolute';
        return this;
    }

    /**
     * 移动
     */
    move(x: number, y: number): Animation {
        if (this.applying.move) this.end(true, 'move');
        this.applySys('ox', x, 'move');
        this.applySys('oy', y, 'move');
        return this;
    }

    /**
     * 旋转
     * @param angle 旋转角度，注意不是弧度
     */
    rotate(angle: number): Animation {
        this.applySys('angle', angle, 'rotate');
        return this;
    }

    /**
     * 缩放
     * @param scale 缩放比例
     */
    scale(scale: number): Animation {
        this.applySys('size', scale, 'resize');
        return this;
    }

    /**
     * 震动
     * @param x 横向震动比例，范围0-1
     * @param y 纵向震动比例，范围0-1
     */
    shake(x: number, y: number): Animation {
        if (this.applying.shake === true) this.end(true, 'shake');

        this.applying.shake = true;
        const { easeTime: time, shakeTiming: timing } = this;
        const start = Date.now();
        this.hook('start', 'shakestart');

        const fn = () => {
            const now = Date.now();
            const delta = now - start;
            if (delta > time) {
                this.ticker.remove(fn);
                this.applying.shake = false;
                this.sx = 0;
                this.sy = 0;
                this.hook('end', 'shakeend');
            }
            const rate = delta / time;
            const p = timing(rate);
            this.sx = p * x;
            this.sy = p * y;
        };
        this.ticker.add(fn);
        this.animateFn.system.shake = fn;
        return this;
    }

    /**
     * 根据路径移动
     */
    moveAs(path: PathFn): Animation {
        // 这个比较独特，要单独处理
        if (this.applying.moveAs) this.end(true, 'moveAs');

        this.applying.moveAs = true;
        this.path = path;
        const { easeTime: time, relation, timing } = this;
        const start = Date.now();
        const [ox, oy] = [this.x, this.y];
        const [tx, ty] = (() => {
            if (relation === 'absolute') return path(1);
            else {
                const [x, y] = path(1);
                return [ox + x, oy + y];
            }
        })();
        this.hook('start', 'movestart');

        const fn = () => {
            const now = Date.now();
            const delta = now - start;
            if (delta > time) {
                this.end(true, 'moveAs');
                return;
            }
            const rate = delta / time;
            const [x, y] = path(timing(rate));
            if (relation === 'absolute') {
                this.ox = x;
                this.oy = y;
            } else {
                this.ox = ox + x;
                this.oy = oy + y;
            }
        };
        this.ticker.add(fn, true);
        this.animateFn.system.moveAs = fn;
        this.targetValue.system.moveAs = [tx, ty];

        return this;
    }

    /**
     * 注册一个可用于动画的属性
     * @param key 要注册的属性的名称
     * @param n 初始值
     */
    register(key: string, n: number): void {
        if (typeof this.value[key] === 'number') {
            return this.error(
                `Property ${key} has been regietered twice.`,
                'reregister'
            );
        }
        this.value[key] = n;
        this.applying[key] = false;
    }

    /**
     * 执行某个自定义属性的动画
     * @param key 要执行的自定义属性
     * @param n 属性的最终值
     * @param first 是否将动画添加到执行列表的开头
     */
    apply(key: string, n: number, first: boolean = false): Animation {
        if (this.applying[key] === true) this.end(false, key);
        if (!(key in this.value))
            this.error(
                `You are trying to execute nonexistent property ${key}.`
            );

        this.applying[key] = true;
        const origin = this.value[key];
        const start = Date.now();
        const { timing, relation, easeTime: time } = this;
        const d = relation === 'absolute' ? n - origin : n;
        this.hook('start');

        const fn = () => {
            const now = Date.now();
            const delta = now - start;
            if (delta > time) {
                this.end(false, key);
                return;
            }
            const rate = delta / time;
            const per = timing(rate);
            this.value[key] = origin + per * d;
        };
        this.ticker.add(fn, first);
        this.animateFn.custom[key] = fn;
        this.targetValue.custom[key] = d + origin;

        return this;
    }

    /**
     * 执行系统属性的动画
     * @param key 系统动画id
     * @param n 最终值
     */
    private applySys(
        key: 'ox' | 'oy' | 'angle' | 'size',
        n: number,
        type: AnimateType
    ): void {
        if (type !== 'move' && this.applying[type] === true)
            this.end(true, type);

        this.applying[type] = true;
        const origin = this[key];
        const start = Date.now();
        const timing = this.timing;
        const relation = this.relation;
        const time = this.easeTime;
        const d = relation === 'absolute' ? n - origin : n;
        this.hook('start', `${type}start`);

        // 每帧执行函数
        const fn = () => {
            const now = Date.now();
            const delta = now - start;
            if (delta > time) {
                // 避免move执行多次
                this.end(true, type);
                return;
            }
            const rate = delta / time;
            const per = timing(rate);
            this[key] = origin + d * per;
            if (key !== 'oy') this.hook(type);
        };
        this.ticker.add(fn, true);
        if (key === 'ox') this.animateFn.system.move[0] = fn;
        else if (key === 'oy') this.animateFn.system.move[1] = fn;
        else this.animateFn.system[type as Exclude<AnimateType, 'move'>] = fn;

        if (type === 'move') {
            key === 'ox' && (this.targetValue.system.move[0] = d + origin);
            key === 'oy' && (this.targetValue.system.move[1] = d + origin);
        } else if (type !== 'shake') {
            this.targetValue.system[type] = d + origin;
        }
    }

    /**
     * 报错
     */
    private error(text: string, type?: 'repeat' | 'reregister'): void {
        if (type === 'repeat')
            throw new Error(
                `Cannot execute the same animation twice. Info: ${text}`
            );
        if (type === 'reregister')
            throw new Error(
                `Cannot register a animated property twice. Info: ${text}`
            );
        throw new Error(text);
    }

    /**
     * 结束一个动画
     */
    private end(sys: true, type: keyof AnimateTargets['system']): void;
    private end(sys: false, type: string): void;
    private end(sys: boolean, type: string): void {
        if (sys === true) {
            // 系统动画
            this.applying[type] = false;

            if (type === 'move') {
                this.ticker.remove(this.animateFn.system.move[0]);
                this.ticker.remove(this.animateFn.system.move[1]);
            } else if (type === 'moveAs') {
                this.ticker.remove(this.animateFn.system.moveAs);
            } else {
                this.ticker.remove(
                    this.animateFn.system[
                        type as Exclude<keyof AnimateTargets['system'], 'move'>
                    ]
                );
            }
            if (type === 'move') {
                const [x, y] = this.targetValue.system.move;
                this.ox = x;
                this.oy = y;
                this.hook('moveend', 'end');
            } else if (type === 'moveAs') {
                const [x, y] = this.targetValue.system.moveAs;
                this.ox = x;
                this.oy = y;
                this.hook('moveend', 'end');
            } else if (type === 'rotate') {
                this.angle = this.targetValue.system.rotate;
                this.hook('rotateend', 'end');
            } else if (type === 'resize') {
                this.size = this.targetValue.system.resize;
                this.hook('resizeend', 'end');
            } else {
                this.sx = 0;
                this.sy = 0;
                this.hook('shakeend', 'end');
            }
        } else {
            // 自定义动画
            this.applying[type] = false;
            this.ticker.remove(this.animateFn.custom[type]);
            this.value[type] = this.targetValue.custom[type];
            this.hook('end');
        }
    }
}
