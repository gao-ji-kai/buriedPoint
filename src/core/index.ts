import { DefaultOptons, TrackerConfig, Options } from "../types/index";
import { createHistoryEvent } from "./../utils/pv";

const MouseEventList: string[] = [
  "click",
  "dblclick",
  "contextmenu",
  "mousedown",
  "mouseup",
  "mouseenter",
  "mouseout",
  "mouseover",
];

export default class Tracker {
  public data: Options;
  constructor(options: Options) {
    this.data = Object.assign(this.initDef(), options); //合并默认参数  后面的会覆盖前面的
    this.installTracker();
  }
  private initDef(): DefaultOptons {
    window.history["pushState"] = createHistoryEvent("pushState");
    window.history["replaceState"] = createHistoryEvent("replaceState");
    return <DefaultOptons>{
      historyTracker: false,
      hashTracker: false,
      domTracker: false,
      jsError: false,
      sdkVersion: TrackerConfig.version,
    };
  }

  public setUserId<T extends DefaultOptons["uuid"]>(uuid: T) {
    this.data.uuid = uuid;
  }

  public setExtra<T extends DefaultOptons["extra"]>(extra: T) {
    this.data.extra = extra;
  }
  // 用户手动上报
  public sendTracker<T>(data: T) {
    this.reportTracker(data);
  }

  //dom 点击上报
  private targetKeyReport() {
    MouseEventList.forEach((event) => {
      window.addEventListener(event, (e) => {
        const target = e.target as HTMLElement;
        const targetValue = target.getAttribute("target-key");
        if (targetValue) {
          this.sendTracker({
            targetKey: targetValue,
            event,
          });
        }
      });
    });
  }

  private captureEvents<T>(
    mouseEventList: string[],
    targetKey: string,
    data?: T
  ) {
    mouseEventList.forEach((event) => {
      window.addEventListener(event, () => {
        console.log("监听到了");
        this.reportTracker({
          event,
          targetKey,
          data,
        });
      }); //监听事件
    });
  }
  private installTracker() {
    if (this.data.historyTracker) {
      this.captureEvents(
        ["pushState", "replaceState", "popstate"],
        "historyTracker"
      );
    }
    if (this.data.hashTracker) {
      this.captureEvents(["hashchange"], "hashTracker");
    }
    if (this.data.domTracker) {
      this.targetKeyReport();
    }
    if (this.data.jsError) {
      this.jsError();
    }
  }

  private jsError() {
    this.errorEvent();
    this.promiseReject();
  }

  private errorEvent() {
    window.addEventListener("error", (e) => {
      this.sendTracker({
        targetKey: "message",
        event: "error",
        message: e.message,
      });
    });
  }
  //捕获promise 错误
  private promiseReject() {
    window.addEventListener("unhandledrejection", (event) => {
      event.promise.catch((error) => {
        this.sendTracker({
          targetKey: "reject",
          event: "promise",
          message: error,
        });
      });
    });
  }

  private reportTracker<T>(data: T) {
    const params = Object.assign(this.data, data, {
      time: new Date().getTime(),
    });
    let headers = {
      type: "application/x-www-form-urlencoded",
    };
    let blob = new Blob([JSON.stringify(params)], headers);
    navigator.sendBeacon(this.data.requestUrl, blob);
  }
}
