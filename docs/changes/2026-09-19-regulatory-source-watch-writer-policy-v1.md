# Regulatory source writer boundary

The repository writer `regulatory-source-watch` is now explicitly authorized to modify exactly one canonical file: `data/regulatory-source-state.json`.

No broader `data/` permission is granted. Neighboring regulatory and arbitrary data files remain rejected by the writer boundary.
