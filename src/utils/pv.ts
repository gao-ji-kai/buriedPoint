export const createHistoryEvent = <T extends keyof History>(type: T) => {
  const origin = history[type];
  return function (this: any) {
    const res = origin.apply(this, arguments);
    const e = new Event(type); //创建一个事件 Event 创建自定义事件
    window.dispatchEvent(e); //派发事件

    return res;
  };
};

