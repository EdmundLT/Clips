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
    private router: Router
  ) {
    auth.user.subscribe((user) => {
      this.user = user;
    });
  }
  ngOnDestroy(): void {
    this.task?.cancel();
  }
  storeFile($event: Event) {
    this.isDragover = false;
    console.log($event);
    this.file = ($event as DragEvent).dataTransfer
      ? ($event as DragEvent).dataTransfer?.files.item(0) ?? null
      : ($event.target as HTMLInputElement).files?.item(0) ?? null;
    if (!this.file || this.file.type !== "video/mp4") {
      return;
    }

    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ""));
    this.nextStep = true;
  }
  uploadFile() {
    this.uploadForm.disable();
    this.showAlert = true;
    this.alertColor = "blue";
    this.alertMsg = "Uploading......";
    this.inSubmission = true;
    this.showPercentage = true;
    const cilpFileName = uuid();
    const clipPath = `clips/${cilpFileName}.mp4`;
    try {
      this.task = this.storage.upload(clipPath, this.file);
      const clipRef = this.storage.ref(clipPath);
      this.task.percentageChanges().subscribe((progress) => {
        this.percentage = progress as number;
      });
      this.task
        .snapshotChanges()
        .pipe(
          last(),
          switchMap(() => clipRef.getDownloadURL())
        )
        .subscribe({
          next: async (url) => {
            const clip = {
              uid: this.user?.uid as string,
              displayName: this.user?.displayName as string,
              title: this.title.value,
              fileName: `${cilpFileName}.mp4`,
              url,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
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
