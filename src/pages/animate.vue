<template>
    <div id="animate">
        <canvas id="animate-canvas" width="800" height="800"></canvas>
        <button id="play" @click="play">播放动画</button>
    </div>
</template>

<script setup lang="ts">
import { Animation } from '../../lib/animate';
import { bezier as bezierPath, circle } from '../../lib/path';
import { hyper, linear, power, shake, bezier } from '../../lib/timing';
import { Transition } from '../../lib/transition';
import { sleep } from '../../lib/utils';

// 一个动画就能测试全部的内容了
async function play() {
    console.log('准备播放');

    await sleep(1000);
    await ani();
}

function b(input: number): number[] {
    return [input * 100, input ** 2 * 100, input ** 3 * 100, input ** 4 * 100];
}

async function ani() {
    const canvas = document.getElementById(
        'animate-canvas'
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const ani = new Animation();
    ctx.save();

    ani.register('a', 0);
    ani.register('b', 0);
    ani.register('c', 0);
    ani.register('d', 0);

    ani.ticker.add(() => {
        ctx.beginPath();
        ctx.restore();
        ctx.save();
        ctx.clearRect(0, 0, 800, 800);
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ani.value.a.toFixed(0), 160, 400);
        ctx.fillText(ani.value.b.toFixed(0), 320, 400);
        ctx.fillText(ani.value.c.toFixed(0), 480, 400);
        ctx.fillText(ani.value.d.toFixed(0), 640, 400);
    });

    // 多个属性绑定
    ani.bind('a', 'b', 'c', 'd').mode(b).absolute().time(5000).applyMulti();
}
</script>

<style scoped lang="less">
button {
    width: 200px;
    height: 40px;
    font-size: 28px;
    font-weight: 200;
    background-color: aquamarine;
    border: 1px solid black;
    border-radius: 5px;
}

#animate {
    display: flex;
    flex-direction: column;
    align-items: center;
}

canvas {
    border: 1px solid black;
    margin: 10px;
}
</style>
