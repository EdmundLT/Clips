import { Component, OnInit } from "@angular/core";

import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "src/app/services/auth.service";
import IUser from "src/app/models/user.model";
@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.css"],
})
export class RegisterComponent {
  constructor(private auth: AuthService) {}
  inSubmission = false;
  name = new FormControl("", [Validators.required, Validators.minLength(3)]);
  email = new FormControl("", [Validators.required, Validators.email]);
  age = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(18),
    Validators.max(120),
  ]);
  password = new FormControl("", [
    Validators.required,
    Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm),
  ]);
  confirm_password = new FormControl("", [Validators.required]);
  phoneNumber = new FormControl("", [
    Validators.required,
    Validators.minLength(13),
    Validators.maxLength(13),
  ]);
  showAlert = false;
  alertMsg = "Please wait!";
  alertColor = "blue";
  registerForm = new FormGroup({
    name: this.name,
    email: this.email,
    age: this.age,
    password: this.password,
    confirm_password: this.confirm_password,
    phoneNumber: this.phoneNumber,
  });

  async register() {
    this.showAlert = true;
    this.alertMsg = "Please wait!";
    this.alertColor = "blue";
    this.inSubmission = true;
    const { email, password } = this.registerForm.value;
    try {
      await this.auth.createUser(this.registerForm.value as IUser);
    } catch (error) {
      console.error(error);
      this.alertMsg = "An unexpeted error occurred, please try again later";
      this.alertColor = "red";
      this.inSubmission = false;
      return;
    }
    this.alertMsg = "Success!";
    this.alertColor = "green";
  }
}
