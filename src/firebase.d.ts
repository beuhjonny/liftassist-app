// src/firebase.d.ts
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Functions } from 'firebase/functions';

export const app: FirebaseApp;
export const db: Firestore;
export const functions: Functions;