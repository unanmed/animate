/**
 * 判断一个值是否不是undefined和null
 * @param value 要判断的值
 */
export function has<T>(value: T): value is NonNullable<T> {
    return value !== void 0 && value !== null;
}

/**
 * 等待一定时长
 * @param time 等待的毫秒数
 */
export async function sleep(time: number): Promise<void> {
    return new Promise(res => setTimeout(res, time));
}
