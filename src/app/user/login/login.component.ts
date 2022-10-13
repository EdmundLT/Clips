import { Component, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit {
  credentials = {
    email: "",
    password: "",
  };

  constructor(private auth: AngularFireAuth) {}
  showAlert = false;
  alertMsg = "Logging in...";
  alertColor = "blue";
  ngOnInit(): void {}
  async login() {
    this.showAlert = true;
    this.alertColor = "blue";
    this.alertMsg = "Logging in...";
    try {
      await this.auth.signInWithEmailAndPassword(
        this.credentials.email,
        this.credentials.password
      );
    } catch (e) {
      this.showAlert = true;
      this.alertMsg = "Error occurred.";
      this.alertColor = "red";

      console.error(e);
      return;
    }
    this.alertMsg = "Logged In.";
    this.alertColor = "green";
  }
}
