import { Routes } from '@angular/router';
import { SoftPage } from './pages/soft-page/soft-page';

export const routes: Routes = [
  { path: '', component: SoftPage },
  { path: '**', redirectTo: '' },
];
