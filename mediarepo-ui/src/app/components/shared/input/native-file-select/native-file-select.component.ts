import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from "@angular/core";
import {FormControl} from "@angular/forms";
import {dialog} from "@tauri-apps/api";
import {DialogFilter} from "@tauri-apps/api/dialog";

@Component({
    selector: "app-native-file-select",
    templateUrl: "./native-file-select.component.html",
    styleUrls: ["./native-file-select.component.scss"]
})
export class NativeFileSelectComponent implements OnInit, OnChanges {


    @Input() mode: "files" | "folders" = "files";
    @Input() formControlName: string | undefined;
    @Input() formControl: FormControl | undefined;
    @Input() startPath: string | undefined;
    @Input() multiSelect: boolean = true;
    @Input() filters: DialogFilter[] = [];

    @Output() fileSelect = new EventEmitter<string[]>();

    public files: string[] = [];
    public label: string | undefined;

    constructor() {
    }

    public ngOnInit(): void {
        this.setLabel();
    }


    public ngOnChanges(changes: SimpleChanges): void {
        if (changes["mode"]) {
            this.setLabel();
        }
    }

    public setFiles(filesExpr: string) {
        this.files = filesExpr.split(",");
        this.fileSelect.emit(this.files);
    }

    /**
     * Opens the native dialog to select files or folders
     * @param {boolean} folders
     * @returns {Promise<void>}
     */
    public async openNativeFileSelectDialog(folders: boolean) {
        const files = await dialog.open({
            multiple: this.multiSelect,
            directory: folders,
            defaultPath: this.startPath,
            filters: this.filters,
        });
        if (files instanceof Array) {
            this.files = files;
        } else if (files) {
            this.files = [files];
        }
        this.fileSelect.emit(this.files);
    }

    private setLabel(): void {
        switch (this.mode) {
            case "files":
                this.label = "shared.file-import-select-files";
                break;
            case "folders":
                this.label = "shared.file-import-select-a-folder";
                break;
        }
    }
}
