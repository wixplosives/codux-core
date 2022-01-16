export class CheckboxDriver {
    constructor(public root: HTMLInputElement) {}

    isChecked(): boolean {
        return this.root.checked;
    }

    toggle(): void {
        this.root.click();
    }
}
