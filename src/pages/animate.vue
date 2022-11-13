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

async function ani() {
    const canvas = document.getElementById(
        'animate-canvas'
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const ani = new Animation();
    ctx.save();

    ani.ticker.add(() => {
        ctx.beginPath();
        ctx.restore();
        ctx.save();
        ctx.clearRect(0, 0, 800, 800);
        ctx.fillStyle = '#0ff';
        ctx.arc(ani.x, ani.y, 50, 0, Math.PI * 2);
        ctx.fill();
    });

    ani.mode(hyper('sin', 'in-out')).time(2000).absolute().move(400, 400);
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
