import { Component, OnDestroy } from "@angular/core";
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from "@angular/fire/compat/storage";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { v4 as uuid } from "uuid";
import { last, switchMap } from "rxjs/operators";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import firebase from "firebase/compat/app";
import { ClipService } from "src/app/services/clip.service";
import { Router } from "@angular/router";
import { FfmpegService } from "src/app/services/ffmpeg.service";
import { combineLatest, forkJoin } from "rxjs";

@Component({
  selector: "app-upload",
  templateUrl: "./upload.component.html",
  styleUrls: ["./upload.component.css"],
})
export class UploadComponent implements OnDestroy {
  isDragover = false;
  file: File | null = null;
  nextStep = false;
  showAlert = false;
  alertMsg = "Uploading";
  alertColor = "blue";
  inSubmission = false;
  showPercentage = false;
  percentage = 0;
  screenshots: string[] = [];
  selectedScreenshot = "";
  screenshotTask?: AngularFireUploadTask;
  user: firebase.User | null = null;
  task?: AngularFireUploadTask;
  title = new FormControl("", {
    validators: [Validators.required, Validators.minLength(3)],
    nonNullable: true,
  });

  uploadForm = new FormGroup({
    title: this.title,
  });

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService
  ) {
    auth.user.subscribe((user) => {
      this.user = user;
    });
    this.ffmpegService.init();
  }
  ngOnDestroy(): void {
    this.task?.cancel();
  }
  async storeFile($event: Event) {
    if (this.ffmpegService.isRunning) {
      return;
    }
    this.isDragover = false;
    console.log($event);
    this.file = ($event as DragEvent).dataTransfer
      ? ($event as DragEvent).dataTransfer?.files.item(0) ?? null
      : ($event.target as HTMLInputElement).files?.item(0) ?? null;
    if (!this.file || this.file.type !== "video/mp4") {
      return;
    }
    this.screenshots = await this.ffmpegService.getScreenshots(this.file);
    this.selectedScreenshot = this.screenshots[0];
    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ""));
    this.nextStep = true;
  }
  async uploadFile() {
    this.uploadForm.disable();
    this.showAlert = true;
    this.alertColor = "blue";
    this.alertMsg = "Uploading......";
    this.inSubmission = true;
    this.showPercentage = true;
    const cilpFileName = uuid();
    const clipPath = `clips/${cilpFileName}.mp4`;

    const screenshotBlob = await this.ffmpegService.blobFromURL(
      this.selectedScreenshot
    );
    const scPath = `screenshots/${cilpFileName}.png`;
    this.screenshotTask = this.storage.upload(scPath, screenshotBlob);
    const screenshotRef = this.storage.ref(scPath);

    try {
      this.task = this.storage.upload(clipPath, this.file);
      const clipRef = this.storage.ref(clipPath);

      this.task.percentageChanges().subscribe((progress) => {
        this.percentage = (progress as number) / 100;
      });
      forkJoin([
        this.task.snapshotChanges(),
        this.screenshotTask?.snapshotChanges(),
      ])
        .pipe(
          switchMap(() =>
            forkJoin([clipRef.getDownloadURL(), screenshotRef.getDownloadURL()])
          )
        )
        .subscribe({
          next: async (urls) => {
            const [clipUrl, screenshotURL] = urls;
            const clip = {
              uid: this.user?.uid as string,
              displayName: this.user?.displayName as string,
              title: this.title.value,
              fileName: `${cilpFileName}.mp4`,
              url: clipUrl,
              screenshotURL,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              screenshotFileName: `${cilpFileName}.png`,
            };
            const clipDocsRef = await this.clipService.createClip(clip);
            console.log(clip);
            this.alertColor = "green";
            this.alertMsg = "Upload success.";
            this.showPercentage = false;
            console.log(clipDocsRef);
            setTimeout(() => {
              this.router.navigate(["clip", clipDocsRef.id]);
            }, 1000);
          },
          error: (error) => {
            this.uploadForm.enable(),
              (this.alertColor = "red"),
              (this.alertMsg = "Upload failed, Please try again later."),
              (this.inSubmission = true),
              (this.showPercentage = false);
            console.error(error);
          },
        });
      console.log("File Uploaded");
    } catch (error) {
      console.log(error);
    }
  }
}
