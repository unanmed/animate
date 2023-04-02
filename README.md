# 动画库 mutate-animate 使用说明

## AnimationBase

这是这个动画库的基础，是一个抽象类，库中包含的两个动画类 Animation 和 Transition 都是继承于它。

下面我们先对一些概念进行介绍

## 速率曲线

这个动画的核心是速率曲线。虽说叫做速率曲线，但其实是完成度曲线，它是一个函数，输入一个\[0,1\]间的数值，输出一个\[0,1\]间的数值（当然也可以超过这个区间，但一般来讲不要超过）。输入值表示了动画在时间上的完成度，输出值，也就是函数的返回值表示了动画在过程上的完成度。

该库中内置了丰富的速率曲线生成函数，这些函数可以根据输入的参数输出对应的速率曲线函数，你可以直接从该库中引入。包括以下内容：

1. 线性渐变函数 `linear()`，该函数返回一个线性变化函数

2. 三角渐变函数 `trigo(type: 'sin' | 'sec', mode: EaseMode)`，该函数返回一个指定属性的三角函数变化函数，其中`EaseMode`可以填`in` `out` `in-out` `center`，分别表示 `慢-快` `快-慢` `慢-快-慢` `快-慢-快`

3. 幂函数渐变 `power(n: number, mode: EaseMode)`，该函数返回一个以 `x^n` 变化的函数，n 是指数

4. 双曲渐变函数 `hyper(type: 'sin' | 'tan' | 'sec', mode: EaseMode)`，该函数返回一个双曲函数，分别是 `双曲正弦` `双曲正切` `双曲正割`

5. 反三角渐变函数 `inverseTrigo(type: 'sin' | 'tan', mode: EaseMode)`，该函数返回一个反三角函数

6. 贝塞尔曲线渐变函数 `bezier(...cps)`，参数为贝塞尔曲线的控制点纵坐标（横坐标不能自定义，因为一个时刻不能对应多个速率）示例：`bezier(0.4, 0.2, 0.7); // 三个控制点的四次贝塞尔曲线渐变函数`

7. 震动变化函数 `shake(power: number, timing: TimingFn)`，它可以输出一个来回震动的速率函数，其中`power`是可能的最大震动量，`timing`是震动量的变化函数

当然，你也可以自定义速率曲线，只要满足`(input: number) => number`即可

## 路径曲线

除了速率曲线，库还提供了一个路径曲线，它允许`x`和`y`在一定的路径下移动。它与速率曲线类似，只不过输出值变成了\[x,y\]数组。库内置了两种路径曲线，它们在`mutate.path`中，包括：

1. 圆形运动 `circle(r: number, n?: number, center?: Point, start?: number, timing?: TimingFn, inverse: boolean)`，`r`是圆的半径，`n`是圈数，`center`是圆心坐标，`start`是起始角度，`timing`描述半径大小的变化，`inverse`说明了是否翻转`timing`函数，后面五个参数可以不填

2. 贝塞尔曲线 `bezierPath(start: Point, end: Point, ...cps: Point[])`，其中`start`和`end`是起点和结束点，应当填入`[x, y]`数组，`cps`是控制点，也是`[x, y]`数组，示例：`bezierPath([0, 0], [200, 200], [100, 50], [300, 150], [200, 180])`，这是一个起点为`[0, 0]`，终点为`[200, 200]`，有三个控制点的四次贝塞尔曲线

## Animation

这是一个非常强大的类，你可以用它来动画改变任何数值

## 引入 & 创建

```js
import { Animation } from 'mutate-animate';

const ani = new Animation();
```

### 动画属性

首先，说到动画，就一定会有一个作用属性。`Animation`自身提供了 4 个系统自带的属性，分别是`x` `y` `angle` `size`，它们分别表示横坐标、纵坐标、旋转角度、放缩大小。当你创建了一个`Animation`实例（这里命名为`ani`）后,你可以通过`ani.x` `ani.y` `ani.angle` `ani.size`来获取，注意这些属性理论上是只读的

你还可以自定义动画属性，你可以通过调用`ani.register(key: string, initValue: number)`来注册一个新的动画属性，注意注册后的属性会被保存在`ani.value`中。其中`key`是属性名称，可以与系统属性重名，`initValue`是属性的初始值

### 动画设置

为了让动画能够正确运行，需要对动画进行设置，包括时间、相对模式等，请看以下示例

```js
ani.time(1000) // 设置动画时间，默认为0，不过注意当时间为0时执行动画仍需要1帧的时间
    .absolute() // 设置为绝对模式，相对模式为relative，默认为绝对模式，注意相对模式下属性为相加关系
    .mode(linear()); // 设置速率曲线，默认为线性变化
```

如果是坐标震动变化的话，请使用`ani.mode(shake(...), true)`

如果不是关于坐标的震动变化，请依然使用`ani.mode(shake(...))`

### 运行动画

以上准备工作做完之后，我们就可以运行动画了，请看以下示例

```js
ani.move(100, 100); // 执行运动到100,100的动画
```

没错！运行动画就是这么简单！这样的话它的坐标就会按照指定的方式运动了。引擎本身提供了五种动画方式，分别是：

1. `move(x: number, y: number)`运动到某个点
2. `scale(size: number)`放缩
3. `rotate(angle: number)`旋转
4. `moveAs(path: PathFn)`按照路径函数移动，使用该动画时请先将相对模式改为相对
5. `shake(x: number, y: number)`震动，x 和 y 分别表示横纵坐标上的震动大小，1 表示最大，0 表示最小

当然，还有运行自定义属性的动画的函数，它是`ani.apply(key: string, n: number)`，其中`key`是动画属性，`n`是动画的目标值

### 等待

很多时候我们需要等待某个动画执行完毕，当然这个引擎也提供了这个功能，共有三种等待方式

1. `ani.n(n: number)`，等待 n 个动画执行完毕
2. `ani.w(type: string)`，等待某种动画执行完毕
3. `ani.all()`，等待所用动画执行完毕

他们都是`async function`，所以请使用`await`或`promise`来执行等待

除此之外，库中还提供了一个等待函数`sleep(time: number)`，它允许你等待指定毫秒数，同样也是`async function`

### 绑定

你还可以绑定多个动画属性，让他们可以在同一个渐变函数的作用下变化。你可以使用 `ani.bind(...attr)`来绑定。绑定之后，这三个动画属性可以被一个返回了长度为 3 的数组的渐变函数执行。绑定使用 `ani.bind`，设置渐变函数仍然使用 `ani.mode`，注意它与单个动画属性是分开的，也就是它不会影响正常的渐变函数。然后使用 `ani.applyMulti` 即可执行动画

```js
// 自定义的一个三属性渐变函数
function b(input) {
    return [input * 100, input ** 2 * 100, input ** 3 * 100];
}
ani.bind('a', 'b', 'c') // 这样会绑定abc这三个动画属性
    .mode(b) // 自定义的一个返回了长度为3的数组的函数
    .time(5000)
    .absolute()
    .applyMulti(); // 执行这个动画
```

### 监听

你可以使用`ani.listen(type: string, fn: (e: Animation) => void)`来监听动画信息，由于不常用，这里便不再赘述。

### 绘制

通过上述描述，你会发现这个动画引擎并不参与绘制，因此绘制需要单独完成，你可以通过`ani.ticker.add(fn: (time: number) => void)`来添加绘制函数，其中`time`是自从这个动画被创建之后经过的毫秒数

### 自定义时间获取函数

你可以修改`ani.getTime`来修改类的时间获取函数，从而使得你可以控制动画的运行速度，甚至是暂停等。例如我想让动画的运行速度变为一半，可以写`ani.getTime = () => Date.now() / 2`

## Transition

这是一个渐变类，允许你在设置一个数值之后让这个数值慢慢变化，类似于 css 的 transition

### 引入 & 创建

```js
import { Transition } from 'mutate-animate';

const tran = new Transition();
```

### 渐变设置

与动画几乎完全一样，你依然可以使用`mode()` `time()` `absolute()` `relative()`进行渐变设置，唯一的不同是`mode`没有第二个参数

### 初始化渐变属性

你应当在第一次对渐变属性赋值时进行初始化，例如：

```js
tran.value.x = 400;
tran.value.y = 400;
```

这样，`x` `y`就被初始化为了 400

### 执行渐变

相比于动画，渐变的执行更为简单，你只需要操作`tran.value[key]`即可

```js
tran.value.x = 600; // 横坐标移至600
tran.relative();
tran.value.y = 200; // 纵坐标向下移动200，因为这里设置成了相对模式，因此赋值操作会让y增加200
```

### 自定义时间获取函数

与动画类似，你可以修改`tran.getTime`来修改类的时间获取函数，从而使得你可以控制渐变的运行速度，甚至是暂停等。

## 示例

### Animation

```ts
const canvas = document.getElementById('animate-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const ani = new Animation();
ctx.save();

ani.register('alpha', 1);

ani.ticker.add(() => {
    ctx.beginPath();
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, 800, 800);
    ctx.fillStyle = '#0ff';
    ctx.globalAlpha = ani.value.alpha;
    ctx.arc(ani.x, ani.y, 50, 0, Math.PI * 2);
    ctx.fill();
});

ani.mode(hyper('sin', 'in-out'))
    .time(2000)
    .absolute()
    .move(400, 400)
    .relative()
    .time(3000)
    .apply('alpha', -1);

await sleep(3000);
ani.time(500)
    .absolute()
    .apply('alpha', 1)
    .time(2000)
    .relative()
    .moveAs(bezier([0, 0], [200, 200], [100, 100], [150, 100]));
```

### Transition

```ts
const canvas = document.getElementById('animate-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const tran = new Transition();
ctx.save();

tran.value.x = 400;
tran.value.y = 400;

tran.ticker.add(() => {
    ctx.beginPath();
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, 800, 800);
    ctx.fillStyle = '#0ff';
    ctx.arc(tran.value.x, tran.value.y, 50, 0, Math.PI * 2);
    ctx.fill();
});

await sleep(1000);
tran.mode(hyper('sin', 'out')).time(600).absolute();
tran.value.x = 200;
tran.value.y = 200;
await sleep(200);
tran.value.y = 600;
await sleep(500);
tran.value.x = 400;
tran.time(2000);
await tran.all();
tran.value.x = 800;
tran.value.x = 0;
await sleep(700);
tran.value.y = 200;
```
