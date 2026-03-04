

## 问题原因

`<button>` HTML 元素有浏览器默认的白色/灰色背景色。包裹猫咪图片的 button（第 280 行）没有显式设置 `background: none`，导致出现白框。

## 修复方案

在 `src/components/CatPet.tsx` 第 282 行的 button className 中添加 `bg-transparent border-none p-0`，去除按钮的默认背景、边框和内边距。

一行改动即可解决。

