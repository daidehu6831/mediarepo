import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import {AppComponent} from "./app.component";
import {CoreModule} from "./components/core/core.module";

export function getLibPath() {
    let libpath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    // libpath += 'fuxa-libs/';
    return libpath;
}

export function createTranslateLoader(http: HttpClient) {
    let appbasepath = getLibPath() || '/';
    return new TranslateHttpLoader(http, appbasepath + 'assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        CoreModule,
        MatSnackBarModule,
        HttpClientModule,
        TranslateModule.forRoot({
            defaultLanguage: window.localStorage.lang || 'zh-cn',
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient]
            }
        }),
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
