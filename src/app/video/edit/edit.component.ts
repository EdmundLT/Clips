import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import IClip from "src/app/models/clip.model";
import { ClipService } from "src/app/services/clip.service";
import { ModalService } from "src/app/services/modal.service";
@Component({
  selector: "app-edit",
  templateUrl: "./edit.component.html",
  styleUrls: ["./edit.component.css"],
})
export class EditComponent implements OnInit, OnDestroy, OnChanges {
  @Input() activeClip: IClip | null = null;
  showAlert = false;
  alertColor = "blue";
  alertMsg = "";
  inUpdating = false;

  @Output() update = new EventEmitter();

  constructor(private modal: ModalService, private clipService: ClipService) {}
  clipID = new FormControl("", { nonNullable: true });
  title = new FormControl("", {
    validators: [Validators.required, Validators.minLength(3)],
    nonNullable: true,
  });

  editForm = new FormGroup({
    title: this.title,
    id: this.clipID,
  });
  ngOnInit(): void {
    this.modal.register("editClip");
  }
  ngOnDestroy(): void {
    this.modal.unregister("editClip");
  }
  ngOnChanges(): void {
    if (!this.activeClip) {
      return;
    }
    this.showAlert = false;
    this.clipID.setValue(this.activeClip.docID as string);
    this.title.setValue(this.activeClip.title);
  }
  async submit() {
    if (!this.activeClip) return;
    this.showAlert = true;
    this.inUpdating = false;
    this.alertColor = "blue";
    this.alertMsg = "Editing..";
    try {
      await this.clipService.updateClip(this.clipID.value, this.title.value);
    } catch (error) {
      console.log(error);
      this.inUpdating = false;
      this.alertColor = "red";
      this.alertMsg = "Something went wrong, Try Again Later.";
    }
    this.activeClip.title = this.title.value;
    this.update.emit(this.activeClip);
    this.inUpdating = false;
    this.alertColor = "green";
    this.alertMsg = "Edit Success!";
  }
}
