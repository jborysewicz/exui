import { Job, View, PlatformDelegate } from "../Model";

export class JobImpl implements Job {

    id: string;
    context: any = {};
    views: any[] = [];
    currentView: View;

    constructor(private delegate: PlatformDelegate) {
        this.id = "job" + this.generateQuickGuid() + "_";
    }

    private generateQuickGuid() {
        return Math.random().toString(36).substring(2, 15);
    }

    addView(component: any): View {
        const view = this.delegate.createNewView(this.generateQuickGuid(), this.context, component);
        this.views.push(view);
        return view;
    }

    setAsCurrent(view: View): void {
        if (this.views.indexOf(view) == -1) {
            throw new Error("View doesn't belongs to the job.");
        }

        this.currentView = view;
        if (!this.delegate.plaftormWillSwitchView || this.delegate.plaftormWillSwitchView(view)) {
            this.delegate.platformDidSwitchView(view);
        }
    }
}
