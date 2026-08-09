import { Routes } from '@angular/router';
import { ThemeIndex } from './pages/theme-index/theme-index';
import { ProfessionalPage } from './pages/professional-page/professional-page';
import { DarkPage } from './pages/dark-page/dark-page';
import { SoftPage } from './pages/soft-page/soft-page';

export const routes: Routes = [
  { path: '', component: ThemeIndex },
  { path: 'professional', component: ProfessionalPage },
  { path: 'dark', component: DarkPage },
  { path: 'soft', component: SoftPage },
];
