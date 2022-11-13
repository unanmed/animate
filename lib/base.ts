import { has } from './utils';
import { Ticker } from './ticker';
import { TimingFn } from './timing';

type BaseHook = 'start' | 'end' | 'running';

type HookFn<Hook extends string> = (e: AnimationBase<Hook>, type: Hook) => void;

type Listeners<H extends string> = { [T in H]: HookFn<T>[] };

export abstract class AnimationBase<Hooks extends string> {
    /** 渐变函数 */
    timing: TimingFn;
    /** 变换时的相对模式，相对或绝对 */
    relation: 'relative' | 'absolute' = 'absolute';
    /** 渐变时间 */
    easeTime: number = 0;
    /** 正在执行的动画 */
    applying: Record<string, boolean> = {};

    /** 每帧执行函数 */
    readonly ticker: Ticker = new Ticker();
    /** 数据信息 */
    readonly value: Record<string, number> = {};
    /** 所有的监听函数 */
    protected readonly listener: Listeners<Hooks | BaseHook> = {} as Listeners<
        Hooks | BaseHook
    >;

    constructor() {
        this.timing = n => n;
    }

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
    async all(): Promise<void> {
        if (Object.values(this.applying).every(v => v === true)) {
            throw new ReferenceError('There is no animates to be waited.');
        }
        await new Promise(res => {
            const fn = () => {
                if (Object.values(this.applying).every(v => v === false)) {
                    this.unlisten('end', fn);
                    res('all animated.');
                }
            };
            this.listen('end', fn);
        });
    }

    /**
     * 等待n个正在执行的动画操作执行完毕
     * @param n 要等待的个数
     */
    async n(n: number): Promise<void> {
        const all = Object.values(this.applying).filter(v => v === true).length;
        if (all < n) {
            throw new ReferenceError(
                `You are trying to wait ${n} animate, but there are only ${all} animate animating.`
            );
        }
        let now = 0;
        await new Promise(res => {
            const fn = () => {
                now++;
                if (now === n) {
                    this.unlisten('end', fn);
                    res(`${n} animated.`);
                }
            };
            this.listen('end', fn);
        });
    }

    /**
     * 等待某个种类的动画执行完毕
     * @param type 要等待的种类
     */
    async w(type: string): Promise<void> {
        if (this.applying[type] === false) {
            throw new ReferenceError(`The ${type} animate is not animating.`);
        }
        await new Promise(res => {
            const fn = () => {
                if (this.applying[type] === false) {
                    this.unlisten('end', fn);
                    res(`${type} animated.`);
                }
            };
            this.listen('end', fn);
        });
    }

    /**
     * 监听动画
     * @param type 监听类型
     * @param fn 监听函数，动画执行过程中会执行该函数
     */
    listen<K extends Hooks | BaseHook>(type: K, fn: HookFn<K>): void {
        this.listener[type] ??= [];
        this.listener[type].push(fn);
    }

    /**
     * 取消监听
     * @param type 监听类型
     * @param fn 取消监听的函数
     */
    unlisten<K extends Hooks | BaseHook>(type: K, fn: HookFn<K>): void {
        const index = this.listener[type].findIndex(v => v === fn);
        if (index === -1)
            throw new ReferenceError(
                'You are trying to remove a nonexistent listener.'
            );
        this.listener[type].splice(index, 1);
    }

    /**
     * 执行监听函数
     * @param type 监听类型
     */
    protected hook(...type: (Hooks | BaseHook)[]): void {
        const all = Object.entries(this.listener).filter(v =>
            type.includes(v[0] as Hooks)
        ) as [Hooks, HookFn<Hooks>[]][];
        for (const [type, fns] of all) {
            for (const fn of fns) {
                fn(this, type as Hooks);
            }
        }
    }
}
