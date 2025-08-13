export class ExportViewport {
  constructor(modelViewer) {
    this.modelViewer = modelViewer;
  }

  async exportPng720() {
    await this.modelViewer.updateComplete;
    const blob = await this.modelViewer.toBlob({ mimeType: 'image/png', quality: 1.0, idealAspect: 1 });
    return blob;
  }
}