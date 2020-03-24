export class CheckboxDriver {
    constructor(public root: HTMLInputElement) {}

    isChecked() {
        return this.root.checked;
    }

    toggle() {
        this.root.click();
    }
}
