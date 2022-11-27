import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit} from "@angular/core";
import {Repository} from "../../../../../api/models/Repository";
import {LoggingService} from "../../../../services/logging/logging.service";
import {RepositoryService} from "../../../../services/repository/repository.service";
import {JobService} from "../../../../services/job/job.service";
import {StateService} from "../../../../services/state/state.service";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {
    AddRepositoryDialogComponent
} from "../../../shared/repository/add-repository-dialog/add-repository-dialog.component";
import {BehaviorSubject} from "rxjs";
import {BusyDialogComponent} from "../../../shared/app-common/busy-dialog/busy-dialog.component";
import {DownloadDaemonDialogComponent} from "../download-daemon-dialog/download-daemon-dialog.component";
import {AboutDialogComponent} from "./about-dialog/about-dialog.component";
import { TranslateService } from "@ngx-translate/core";

type BusyDialogContext = { message: BehaviorSubject<string>, dialog: MatDialogRef<BusyDialogComponent> };

@Component({
    selector: "app-repository-overview",
    templateUrl: "./repository-overview.component.html",
    styleUrls: ["./repository-overview.component.scss"],
    changeDetection: ChangeDetectionStrategy.Default
})
export class RepositoryOverviewComponent implements OnInit, AfterViewInit {

    public repositories: Repository[] = [];

    constructor(
        private logger: LoggingService,
        private repoService: RepositoryService,
        private jobService: JobService,
        private stateService: StateService,
        private translateService: TranslateService,
        public dialog: MatDialog
    ) {
    }

    ngOnInit(): void {
        this.repoService.repositories.subscribe(repos => this.repositories = repos);
    }

    public async ngAfterViewInit() {
        await this.checkAndPromptDaemonExecutable();
    }

    public async startDaemonAndSelectRepository(repository: Repository) {
        try {
            let dialogContext = this.openStartupDialog(repository);
            let daemonRunning = await this.repoService.checkDaemonRunning(
                repository.path!);
            if (!daemonRunning) {
                let message = "dlg.opening-repository.starting-repository-daemon-message";
                this.translateService.get(message).subscribe((txt: string) => { message = txt; });
                dialogContext.message.next(message);
                await this.repoService.startDaemon(repository.path!);

                await new Promise((res, _) => {
                    setTimeout(res, 2000); // wait for the daemon to start
                });
            }
            await this.selectRepository(repository, dialogContext);
        } catch (err: any) {
            this.logger.error(err);
        }
    }

    public async selectRepository(repository: Repository, dialogContext?: BusyDialogContext) {
        dialogContext = dialogContext ?? this.openStartupDialog(repository);
        try {
            let message = "dlg.opening-repository.message";
            this.translateService.get(message).subscribe((txt: string) => { message = txt; });
            dialogContext.message.next(message);
            await this.repoService.setRepository(repository);
            await this.runRepositoryStartupTasks(dialogContext);

            this.translateService.get("restoring-previous-tabs").subscribe((txt: string) => { message = txt; });
            dialogContext.message.next(message);
            await this.repoService.loadRepositories();
            dialogContext.dialog.close(true);
        } catch (err: any) {
            this.logger.error(err);
            let message = "dlg.opening-repository.failed-to-open-repository-message";
            this.translateService.get(message).subscribe((txt: string) => { message = txt; });
            dialogContext.message.next(
                message + err.toString());
            await this.forceCloseRepository();
            setTimeout(() => dialogContext!.dialog.close(true), 1000);
        }
    }

    public openAddRepositoryDialog() {
        this.dialog.open(AddRepositoryDialogComponent, {
            disableClose: true,
            minWidth: "30%",
            minHeight: "30%",
        });
    }

    public async onOpenRepository(repository: Repository) {
        if (!repository.local) {
            await this.selectRepository(repository);
        } else {
            await this.startDaemonAndSelectRepository(repository);
        }
    }

    public openAboutDialog(): void {
        this.dialog.open(AboutDialogComponent, {
            minWidth: "30%",
            minHeight: "50%",
        });
    }

    private async forceCloseRepository() {
        try {
            await this.repoService.closeSelectedRepository();
        } catch {
        }
        try {
            await this.repoService.disconnectSelectedRepository();
        } catch {
        }
    }

    private async runRepositoryStartupTasks(dialogContext: BusyDialogContext): Promise<void> {
        let message = "dlg.opening-repository.check-integrity-message";

        this.translateService.get(message).subscribe((txt: string) => { message = txt; });
        dialogContext.message.next(message);
        await this.jobService.runJob("CheckIntegrity");

        this.translateService.get("dlg.opening-repository.generate-thumbnails-message").subscribe((txt: string) => { message = txt; });
        dialogContext.message.next(message);
        await this.jobService.runJob("GenerateThumbnails");
        
        this.translateService.get("dlg.opening-repository.calculate-sizes-message").subscribe((txt: string) => { message = txt; });
        dialogContext.message.next(message);
        await this.jobService.runJob("CalculateSizes", false);

        this.translateService.get("dlg.opening-repository.finished-repository-startup-message").subscribe((txt: string) => { message = txt; });
        dialogContext.message.next(message);
    }

    private openStartupDialog(repository: Repository): BusyDialogContext {
        let title = "dlg.opening-repository.title";
        this.translateService.get(title).subscribe((txt: string) => { title = txt; });
        let message = "dlg.opening-repository.message";
        this.translateService.get(message).subscribe((txt: string) => { message = txt; });

        const dialogMessage = new BehaviorSubject<string>(message);
        let dialog = this.dialog.open(BusyDialogComponent, {
            data: {
                title: `${title} ${repository.name}`,
                message: dialogMessage,
                allowCancel: true,
            }, disableClose: true,
            minWidth: "30%",
            minHeight: "30%",
        });
        dialog.afterClosed().subscribe(async (result) => {
            if (!result) {
                await this.forceCloseRepository();
            }
        });

        return { message: dialogMessage, dialog };
    }

    private async checkAndPromptDaemonExecutable() {
        if (!await this.repoService.checkDameonConfigured()) {
            const result = await this.dialog.open(
                DownloadDaemonDialogComponent,
                {
                    disableClose: true,
                }
            ).afterClosed().toPromise();
            if (result) {
                // recursion avoidance
                setTimeout(
                    async () => await this.checkAndPromptDaemonExecutable(), 0);
            }
        }
    }
}
