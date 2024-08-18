export type TickerFn = (time: number) => void;

let tickers: Ticker[] = [];
const fn = (time: number) => {
    for (const ticker of tickers) {
        if (ticker.status === 'running') {
            try {
                for (const fn of ticker.funcs) {
                    fn(time - ticker.startTime);
                }
            } catch (e) {
                ticker.destroy();
                console.error(e);
            }
        }
    }
    requestAnimationFrame(fn);
};
requestAnimationFrame(fn);

export class Ticker {
    /** 所有的ticker函数 */
    funcs: Set<TickerFn> = new Set();
    /** 当前ticker的状态 */
    status: 'stop' | 'running' = 'stop';
    /** 开始时间 */
    startTime: number = 0;

    constructor() {
        this.status = 'running';
        tickers.push(this);
        requestAnimationFrame(time => (this.startTime = time));
    }

    /**
     * 添加ticker函数
     * @param fn 要添加的函数
     */
    add(fn: TickerFn): Ticker {
        this.funcs.add(fn);
        return this;
    }

    /**
     * 去除ticker函数
     * @param fn 要去除的函数
     */
    remove(fn: TickerFn): Ticker {
        this.funcs.delete(fn);
        return this;
    }

    /**
     * 清空这个ticker的所有ticker函数
     */
    clear(): void {
        this.funcs.clear();
    }

    /**
     * 摧毁这个ticker
     */
    destroy(): void {
        this.clear();
        this.stop();
    }

    /**
     * 停止运行这个ticker
     */
    private stop(): void {
        this.status = 'stop';
        tickers = tickers.filter(v => v !== this);
    }
}
