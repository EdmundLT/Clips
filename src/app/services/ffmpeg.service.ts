import { Injectable } from "@angular/core";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
@Injectable({
  providedIn: "root",
})
export class FfmpegService {
  isReady = false;
  isRunning = false;
  private ffmpeg;
  constructor() {
    this.ffmpeg = createFFmpeg({ log: true });
  }
  async init() {
    if (this.isReady) {
      return;
    }
    await this.ffmpeg.load();

    this.isReady = true;
  }
  async getScreenshots(file: File) {
    this.isRunning = true;
    const data = await fetchFile(file);
    this.ffmpeg.FS("writeFile", file.name, data);

    const seconds = [1, 2, 3];
    const commands: string[] = [];
    seconds.forEach((sec) => {
      commands.push(
        "-i",
        file.name,
        "-ss",
        `00:00:0${sec}`,
        "-frames:v",
        "1",
        "-filter:v",
        "scale=510:-1",
        `output_0${sec}.png`
      );
    });
    await this.ffmpeg.run(...commands);

    const screenshots: string[] = [];
    seconds.forEach((sec) => {
      const screenshotFile = this.ffmpeg.FS("readFile", `output_0${sec}.png`);
      const screenshotsBlob = new Blob([screenshotFile.buffer], {
        type: "image/png",
      });
      const screenshotUrl = URL.createObjectURL(screenshotsBlob);
      screenshots.push(screenshotUrl);
    });
    this.isRunning = false;
    return screenshots;
  }

  async blobFromURL(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    return blob;
  }
}
