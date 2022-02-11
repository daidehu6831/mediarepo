import {Component, Input, OnInit} from "@angular/core";
import {File} from "../../../../api/models/File";
import {TabState} from "../../../models/TabState";
import {RepositoryMetadata} from "../../../../api/api-types/repo";
import {RepositoryService} from "../../../services/repository/repository.service";
import {TabCategory} from "../../../models/TabCategory";

@Component({
    selector: "app-files-tab",
    templateUrl: "./files-tab.component.html",
    styleUrls: ["./files-tab.component.scss"]
})
export class FilesTabComponent implements OnInit {

    @Input() state!: TabState;

    files: File[] = [];
    contentLoading = false;
    selectedFiles: File[] = [];
    public metadata?: RepositoryMetadata;

    constructor(
        repoService: RepositoryService,
    ) {
        repoService.metadata.subscribe(m => this.metadata = m);
    }

    async ngOnInit() {
        this.state.files.subscribe(files => this.files = files);
        this.state.loading.subscribe(loading => this.contentLoading = loading);
    }

    async onFileSelect(files: File[]) {
        this.selectedFiles = files;
        if (files.length === 1) {
            this.state.selectedCD.next(files[0].cd);
        } else {
            this.state.selectedCD.next(undefined);
        }
        console.debug(this.selectedFiles);
    }

    public getStateSelectedFile(): File | undefined {
        const hash = this.state.selectedCD.value;

        if (hash) {
            return this.files.find(f => f.cd === hash);
        } else {
            return undefined;
        }
    }

    public async onKeydown(event: KeyboardEvent) {
        switch (event.key) {
            case "F5":
                await this.state.findFiles();
                break;
        }
    }

    public onImportFiles(): void {
        this.state.category = TabCategory.Import;
    }
}
