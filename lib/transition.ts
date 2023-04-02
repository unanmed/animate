import { has } from './utils';
import { AnimationBase } from './base';
import { Ticker, TickerFn } from './ticker';
import { TimingFn } from './timing';

type TransitionHook = 'start' | 'end' | 'running';

export class Transition extends AnimationBase<TransitionHook> {
    /** 当前值 */
    private now: Record<string, number> = {};
    /** 目标值 */
    private target: Record<string, number> = {};
    /** 正在执行的渐变 */
    private transitionFn: Record<string, TickerFn> = {};

    /** 目标值 */
    value: Record<string, number>;

    constructor() {
        super();
        this.timing = n => n;
        this.value = new Proxy(this.target, {
            set: this.handleSet,
            get: this.handleGet
        });
    }

    /**
     * 设置移动时的动画函数
     * @param fn 动画函数
     */
    mode(fn: TimingFn): Transition {
        this.timing = fn;
        return this;
    }

    /**
     * 设置渐变动画时间
     * @param time 要设置成的时间
     */
    time(time: number): Transition {
        this.easeTime = time;
        return this;
    }

    /**
     * 相对模式
     */
    relative(): Transition {
        this.relation = 'relative';
        return this;
    }

    /**
     * 绝对模式
     */
    absolute(): Transition {
        this.relation = 'absolute';
        return this;
    }

    /**
     * 渐变一个动画属性
     * @param key 渐变的动画属性
     * @param value 渐变至的目标值
     */
    transition(key: string, value: number): Transition {
        if (value === this.target[key]) return this;
        if (!has(this.now[key])) {
            this.now[key] = value;
            return this;
        }
        if (this.applying[key]) this.end(key, true);
        this.applying[key] = true;
        this.hook('start');

        const start = this.getTime();
        const time = this.easeTime;
        const timing = this.timing;
        const from = this.now[key];
        const to = value + (this.relation === 'absolute' ? 0 : from);
        const d = to - from;
        this.target[key] = to;

        const fn = () => {
            const now = this.getTime();
            const delta = now - start;
            if (delta >= time) {
                this.end(key);
            }
            const rate = delta / time;
            this.now[key] = timing(rate) * d + from;
            this.hook('running');
        };
        this.transitionFn[key] = fn;
        this.ticker.add(fn);
        return this;
    }

    /**
     * 当值被设置时
     */
    private handleSet = (
        target: Record<string, number>,
        p: string,
        value: number
    ) => {
        this.transition(p, value);
        return true;
    };

    /**
     * 获取值时
     */
    private handleGet = (target: Record<string, number>, p: string) => {
        return this.now[p];
    };

    /**
     * 结束一个渐变
     * @param type 渐变类型
     * @param noset 是否不将属性设置为目标值
     */
    private end(type: string, noset: boolean = false): void {
        const fn = this.transitionFn[type];
        if (!has(fn))
            throw new ReferenceError(
                `You are trying to end an ended transition: ${type}`
            );
        this.ticker.remove(this.transitionFn[type]);
        delete this.transitionFn[type];
        this.applying[type] = false;
        this.hook('end');
        if (!noset) {
            this.now[type] = this.target[type];
        }
    }
}
