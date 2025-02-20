import {Component, ViewChild} from "@angular/core";
import {MatTabChangeEvent, MatTabGroup} from "@angular/material/tabs";
import { TranslateService } from '@ngx-translate/core';

import {Repository} from "../../../api/models/Repository";
import {RepositoryService} from "../../services/repository/repository.service";
import {TagService} from "../../services/tag/tag.service";
import {TabService} from "../../services/tab/tab.service";
import {TabCategory} from "../../models/state/TabCategory";
import {AppState} from "../../models/state/AppState";
import {StateService} from "../../services/state/state.service";
import {TabState} from "../../models/state/TabState";

@Component({
    selector: "app-core",
    templateUrl: "./core.component.html",
    styleUrls: ["./core.component.scss"]
})
export class CoreComponent {

    public selectedRepository: Repository | undefined;
    public tabs: TabState[] = [];
    public appState: AppState;
    public newTab = false;

    @ViewChild("tabGroup") tabGroup!: MatTabGroup;

    constructor(
        private tabService: TabService,
        private repoService: RepositoryService,
        private stateService: StateService,
        private tagService: TagService,
        private translateService: TranslateService,
    ) {
        this.selectedRepository = this.repoService.selectedRepository.getValue();

        this.repoService.selectedRepository.subscribe(async (selected) => {
            this.selectedRepository = selected;

            if (this.selectedRepository) {
                await this.loadRepoData();
            } else {
                this.newTab = false;
            }
        });
        this.appState = this.stateService.state.getValue();

        this.stateService.state.subscribe(state => {
            this.appState = state;
            if (this.appState.tabs.value.length === 0) {
                this.addEmptyTab();
            } else {
                this.tabGroup.selectedIndex = 1;
            }
            state.tabs.subscribe(tabs => {
                this.tabs = tabs;
                const selectedIndex = state.selectedTab.value;

                if (selectedIndex) {
                    this.tabGroup.selectedIndex = selectedIndex;
                }

                if (this.tabs.length === 0) {
                    this.addEmptyTab();
                }
            });
        });
    }

    async loadRepoData() {
        await this.tagService.loadTags();
        await this.tagService.loadNamespaces();
    }

    public onTabSelectionChange(event: MatTabChangeEvent): void {
        this.tabService.setSelectedTab(event.index);
        if (event.index > 0 && event.index <= this.tabs.length) {
            this.appState.selectedTab.next(event.index);
        }
    }

    public addEmptyTab(): void {
        if (this.tabGroup) {
            this.newTab = true;
            this.tabGroup.selectedIndex = this.tabs.length + 1;
        }
    }

    public async closeTab(tab: TabState) {
        const previousIndex = this.tabGroup.selectedIndex;
        await this.appState.closeTab(tab.uuid);

        if (previousIndex) {
            if (previousIndex === 1 && this.tabs.length >= 1) {
                this.tabGroup.selectedIndex = previousIndex;
            } else {
                this.tabGroup.selectedIndex = previousIndex - 1;
            }
        } else {
            this.tabGroup.selectedIndex = 0;
        }
    }

    public async onMouseClickTabLabel(tab: TabState, event: MouseEvent) {
        if (event.button === 1) { // middle mouse button
            await this.closeTab(tab);
        }
    }

    public trackByTabId(index: number, item: TabState) {
        return item.uuid;
    }

    public addTab(category: TabCategory): void {
        this.appState.addTab(category);
        this.tabGroup.selectedIndex = this.tabs.length;
        this.newTab = false;
    }
}
