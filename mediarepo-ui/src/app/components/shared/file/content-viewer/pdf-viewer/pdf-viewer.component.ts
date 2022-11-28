import {Component, Input, SecurityContext, OnInit, Injectable} from "@angular/core";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {
    CanActivate,
    Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateChild,
} from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { map } from "rxjs/operators";
import { NgxExtendedPdfViewerService } from 'ngx-extended-pdf-viewer';

@Component({
    selector: "app-pdf-viewer",
    templateUrl: "./pdf-viewer.component.html",
    styleUrls: ["./pdf-viewer.component.scss"]
})
export class PdfViewerComponent implements OnInit {
    public src!: Blob;

    private _fullscreen = false;
    public get fullscreen(): boolean {
        return this._fullscreen;
    }

    public set fullscreen(full: boolean) {
        this._fullscreen = full;
        setTimeout(() =>
            this.ngxService.recalculateSize());
    }

    @Input() blobUrl!: SafeResourceUrl;

    public pdfSrc: string = "";

    constructor(private http: HttpClient,
        private ngxService: NgxExtendedPdfViewerService,
        private sanitizer: DomSanitizer, ) {

    }
    public ngOnInit(): void {
        let surl = this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, this.blobUrl);
        this.pdfSrc = surl? surl:"";
        console.log("this.pdfSrc",this.pdfSrc,this.blobUrl);
        this.loadLargeFile();
    }

    public loadLargeFile(): void {
        this.http
            .get(
                this.pdfSrc,
                { responseType: 'blob' }
            )
            .subscribe((res) => this.src = res);
    }
}
