export interface AttributeIconOption {
    key: string;
    label: string;
}

// Opciones curadas para el selector de icono de atributos personalizados.
// Las claves son nombres de componentes de `systems/iconRegistry`.
export const ATTRIBUTE_ICON_OPTIONS: AttributeIconOption[] = [
    { key: "Brain", label: "Mente" },
    { key: "BookOpen", label: "Estudio" },
    { key: "Code", label: "Código" },
    { key: "MusicNotes", label: "Música" },
    { key: "PaintBrush", label: "Arte" },
    { key: "Calculator", label: "Lógica" },
    { key: "ChatCircleDots", label: "Social" },
    { key: "Barbell", label: "Fuerza" },
    { key: "Coins", label: "Finanzas" },
    { key: "Leaf", label: "Bienestar" },
    { key: "Star", label: "Destacado" },
    { key: "Target", label: "Enfoque" },
    { key: "MagnifyingGlass", label: "Análisis" },
    { key: "GameController", label: "Juego" },
    { key: "PenNib", label: "Escritura" },
    { key: "Heartbeat", label: "Salud" }
];
