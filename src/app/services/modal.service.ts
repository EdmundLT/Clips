import { Injectable } from '@angular/core';

interface IModal {
  id: string;
  visible: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modals: IModal[] = [];
  constructor() {}

  register(id: string) {
    this.modals.push({
      id,
      visible: false,
    });
    console.log(this.modals);
  }
  unregister(id: string) {
    this.modals = this.modals.filter((ele) => ele.id !== id);
  }
  isModalOpen(id: string): boolean {
    return !!this.modals.find((ele) => ele.id === id)?.visible;
  }
  toggleModal(id: string) {
    const modal = this.modals.find((ele) => ele.id === id);

    if (modal) {
      modal.visible = !modal.visible;
    }
  }
}
