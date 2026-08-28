import type { IconProps } from "@phosphor-icons/react";
import { resolveIcon } from "../../systems/iconRegistry";

interface IconGlyphProps extends Omit<IconProps, "ref"> {
    iconKey: string;
}

// Resuelve una clave de string (nueva, tipo "Brain") contra el registro de
// Phosphor. Si no matchea (emoji legado guardado antes de esta migración),
// cae a renderizar el string tal cual para no romper datos existentes.
function IconGlyph({ iconKey, ...props }: IconGlyphProps) {
    const ResolvedIcon = resolveIcon(iconKey);

    if (!ResolvedIcon) {
        return <span aria-hidden="true">{iconKey}</span>;
    }

    // oxlint's static-components check can't see that ICON_REGISTRY is a fixed
    // module-level map — ResolvedIcon is always the same component reference
    // for a given iconKey, so this doesn't reset state across renders.
    return <ResolvedIcon aria-hidden="true" {...props} />;
}

export default IconGlyph;
