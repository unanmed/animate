declare module 'mutate-animate' {
    /**
     * 渐变函数，输入0-1之间的数，输出一个0-1之间的数，说明了动画完成度，1表示结束，0表示开始
     */
    type TimingFn = (input: number) => number;

    /**
     * in: 慢-快
     * out: 快-慢
     * in-out: 慢-快-慢
     * center: 快-慢-快
     */
    type EaseMode = 'in' | 'out' | 'in-out' | 'center';

    type TimingGenerator = (...args: any) => TimingFn;

    type Point = [x: number, y: number];

    /**
     * 路径函数，输入一个0-1的数，输出一个该时刻的位置
     */
    type PathFn = (input: number) => Point;

    type PathG = (...args: any) => PathFn;

    type BaseHook = 'start' | 'end' | 'running';

    type HookFn<Hook extends string> = (
        e: AnimationBase<Hook>,
        type: Hook
    ) => void;

    type Listeners<H extends string> = { [T in H]: HookFn<T>[] };

    type AnimateFn = (e: Animation, type: AnimateHook) => void;

    type AnimateType = 'move' | 'rotate' | 'resize' | 'shake';

    type AnimateTime = 'start' | 'end' | 'running';

    /**
     * 动画生命周期钩子
     */
    type AnimateHook =
        | `${AnimateType}${AnimateTime}`
        | AnimateType
        | AnimateTime;

    type TransitionHook = 'start' | 'end' | 'running';

    type TickerFn = (time: number) => void;

    export abstract class AnimationBase<Hooks extends string> {
        /** 渐变函数 */
        timing: TimingFn;
        /** 变换时的相对模式，相对或绝对 */
        relation: 'relative' | 'absolute';
        /** 渐变时间 */
        easeTime: number;
        /** 正在执行的动画 */
        applying: Record<string, boolean>;

        /** 每帧执行函数 */
        readonly ticker: Ticker;
        /** 数据信息 */
        readonly value: Record<string, number>;
        /** 所有的监听函数 */
        protected readonly listener: Listeners<Hooks | BaseHook>;

        /**
         * 设置移动时的动画函数
         * @param fn 动画函数
         */
        abstract mode(fn: TimingFn): AnimationBase<Hooks>;

        /**
         * 设置渐变动画时间
         * @param time 要设置成的时间
         */
        abstract time(time: number): AnimationBase<Hooks>;

        /**
         * 相对模式
         */
        abstract relative(): AnimationBase<Hooks>;

        /**
         * 绝对模式
         */
        abstract absolute(): AnimationBase<Hooks>;

        /**
         * 等待所有的正在执行的动画操作执行完毕
         */
        all(): Promise<void>;

        /**
         * 等待n个正在执行的动画操作执行完毕
         * @param n 要等待的个数
         */
        n(n: number): Promise<void>;

        /**
         * 等待某个种类的动画执行完毕
         * @param type 要等待的种类
         */
        w(type: string): Promise<void>;

        /**
         * 监听动画
         * @param type 监听类型
         * @param fn 监听函数，动画执行过程中会执行该函数
         */
        listen<K extends Hooks | BaseHook>(type: K, fn: HookFn<K>): void;

        /**
         * 取消监听
         * @param type 监听类型
         * @param fn 取消监听的函数
         */
        unlisten<K extends Hooks | BaseHook>(type: K, fn: HookFn<K>): void;

        /**
         * 执行监听函数
         * @param type 监听类型
         */
        protected hook(...type: (Hooks | BaseHook)[]): void;
    }

    export class Animation extends AnimationBase<AnimateHook> {
        /** 震动变化函数 */
        shakeTiming: TimingFn;
        /** 根据路径移动时的路径函数 */
        path: PathFn;

        /** 自定义的动画属性 */
        value: Record<string, number>;
        /** 放缩的大小 */
        size: number;
        /** 角度 */
        angle: number;

        /** 横坐标 */
        get x(): number;
        /** 纵坐标 */
        get y(): number;

        /**
         * 设置移动时的动画函数
         * @param fn 动画函数
         * @param shake 是否是震动变化
         */
        mode(fn: TimingFn, shake?: boolean): Animation;

        /**
         * 设置渐变动画时间
         * @param time 要设置成的时间
         */
        time(time: number): Animation;

        /**
         * 相对模式
         */
        relative(): Animation;

        /**
         * 绝对模式
         */
        absolute(): Animation;

        /**
         * 移动
         */
        move(x: number, y: number): Animation;

        /**
         * 旋转
         * @param angle 旋转角度，注意不是弧度
         */
        rotate(angle: number): Animation;

        /**
         * 缩放
         * @param scale 缩放比例
         */
        scale(scale: number): Animation;

        /**
         * 震动
         * @param x 横向震动比例，范围0-1
         * @param y 纵向震动比例，范围0-1
         */
        shake(x: number, y: number): Animation;

        /**
         * 根据路径移动
         */
        moveAs(path: PathFn): Animation;

        /**
         * 注册一个可用于动画的属性
         * @param key 要注册的属性的名称
         * @param n 初始值
         */
        register(key: string, n: number): void;

        /**
         * 执行某个自定义属性的动画
         * @param key 要执行的自定义属性
         * @param n 属性的最终值
         * @param first 是否将动画添加到执行列表的开头
         */
        apply(key: string, n: number, first?: boolean): Animation;
    }

    export class Ticker {
        /** 所有的ticker函数 */
        funcs: TickerFn[];
        /** 当前ticker的状态 */
        status: 'stop' | 'running';
        /** 开始时间 */
        startTime: number;

        constructor();

        /**
         * 添加ticker函数
         * @param fn 要添加的函数
         */
        add(fn: TickerFn, first?: boolean): Ticker;

        /**
         * 去除ticker函数
         * @param fn 要去除的函数
         */
        remove(fn: TickerFn): Ticker;

        /**
         * 清空这个ticker的所有ticker函数
         */
        clear(): void;

        /**
         * 摧毁这个ticker
         */
        destroy(): void;
    }

    export class Transition extends AnimationBase<TransitionHook> {
        /** 目标值 */
        value: Record<string, number>;

        /**
         * 设置移动时的动画函数
         * @param fn 动画函数
         */
        mode(fn: TimingFn): Transition;

        /**
         * 设置渐变动画时间
         * @param time 要设置成的时间
         */
        time(time: number): Transition;

        /**
         * 相对模式
         */
        relative(): Transition;

        /**
         * 绝对模式
         */
        absolute(): Transition;

        /**
         * 渐变一个动画属性
         * @param key 渐变的动画属性
         * @param value 渐变至的目标值
         */
        transition(key: string, value: number): Transition;
    }

    /**
     * 线性变化
     */
    export function linear(): TimingFn;

    /**
     * 贝塞尔曲线变化，起点0，终点1
     * @param cps 所有的控制点纵坐标，数量需要大于等于1，范围0-1
     * @returns
     */
    export function bezier(...cps: number[]): TimingFn;

    /**
     * 三角函数变化
     * @param ease 缓动方式
     */
    export function trigo(mode: 'sin' | 'sec', ease: EaseMode): TimingFn;

    /**
     * 幂函数变化
     * @param n 指数
     * @param ease 缓动方式
     */
    export function power(n: number, ease: EaseMode): TimingFn;

    /**
     * 双曲函数变化
     */
    export function hyper(
        mode: 'sin' | 'tan' | 'sec',
        ease: EaseMode
    ): TimingFn;

    /**
     * 反三角函数变化
     */
    export function inverseTrigo(mode: 'sin' | 'tan', ease: EaseMode): TimingFn;

    /**
     * 震动变化
     * @param power 最大震动强度，该值越大最大振幅越大
     * @param timing 强度的变化函数，当其返回值为1时表示振幅达到最大值
     * @returns 震动的变化函数
     */
    export function shake(power: number, timing?: TimingFn): TimingFn;

    /**
     * 圆形轨迹
     * @param r 半径大小
     * @param n 旋转的圈数
     * @param center 圆心
     * @param start 起始角度
     * @param timing 半径变化函数，1表示原长，0表示半径为0
     * @param inverse 是否翻转timing函数
     */
    export function circle(
        r: number,
        n?: number,
        center?: [number, number],
        start?: number,
        timing?: TimingFn,
        inverse?: boolean
    ): PathFn;

    /**
     * 贝塞尔曲线轨迹
     * @param start 起点
     * @param end 终点
     * @param cps 控制点，是[x, y]数组
     */
    export function bezier(start: Point, end: Point, ...cps: Point[]): PathFn;
}
