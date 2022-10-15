import { Injectable } from "@angular/core";
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from "@angular/fire/compat/firestore";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import IUser from "../models/user.model";
import { delay, filter, map, Observable, of, switchMap } from "rxjs";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userCollection: AngularFirestoreCollection<IUser>;
  public isAuthenticated$: Observable<boolean>;
  public isAuthenticatedWithDelay$: Observable<boolean>;
  private redirect = false;
  constructor(
    private db: AngularFirestore,
    private auth: AngularFireAuth,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userCollection = db.collection("users");
    this.isAuthenticated$ = auth.user.pipe(map((user) => !!user));
    this.isAuthenticatedWithDelay$ = this.isAuthenticated$.pipe(delay(1000));
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        map((e) => {
          return this.route.firstChild;
        }),
        switchMap((route) => {
          return route?.data ?? of({});
        })
      )
      .subscribe((data) => {
        this.redirect = data.authOnly ?? false;
      });
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
  public async logout($event?: Event) {
    if ($event) {
      $event.preventDefault();
    }
    await this.auth.signOut();
    if (this.redirect) {
      await this.router.navigateByUrl("/");
    }
  }
}
