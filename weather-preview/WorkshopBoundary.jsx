import React from "react";

export class WorkshopBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="workshop-recovery" role="alert">
      <h1>Nie udało się otworzyć pracowni.</h1>
      <p>Połączenie mogło zostać przerwane albo pojawiła się nowa wersja strony. Odśwież pracownię, aby spróbować ponownie.</p>
      <p>Odświeżenie nie usuwa zapisanych odpowiedzi. Niezapisany wybór trzeba będzie powtórzyć.</p>
      <button type="button" onClick={() => location.reload()}>Odśwież pracownię</button>
      <a href={this.props.mainSite}>Wróć do CHMURNIKA</a>
    </main>;
  }
}
