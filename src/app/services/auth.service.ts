import { Injectable } from "@angular/core";
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from "@angular/fire/compat/firestore";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import IUser from "../models/user.model";
import { delay, map, Observable } from "rxjs";
@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userCollection: AngularFirestoreCollection<IUser>;
  public isAuthenticated$: Observable<boolean>;
  public isAuthenticatedWithDelay$: Observable<boolean>;
  constructor(private db: AngularFirestore, private auth: AngularFireAuth) {
    this.userCollection = db.collection("users");
    this.isAuthenticated$ = auth.user.pipe(map((user) => !!user));
    this.isAuthenticatedWithDelay$ = this.isAuthenticated$.pipe(delay(1000));
  }

  public async createUser(userData: IUser) {
    if (!userData.password) {
      throw new Error("Password not provided");
    }
    const userCred = await this.auth.createUserWithEmailAndPassword(
      userData.email as string,
      userData.password as string
    );

    await this.userCollection.doc(userCred.user?.uid).set({
      name: userData.name,
      email: userData.email,
      age: userData.age,
      phoneNumber: userData.phoneNumber,
    });

    await userCred.user?.updateProfile({
      displayName: userData.name,
    });
  }
}
