# Explicit public locale navigation recovery

Public locale clicks now explicitly navigate with `location.assign()` after persisting locale state and closing menus. This removes the mobile-menu race where default anchor navigation could be dropped. Terminal proof remains NL → EN → NL on production plus cross-page language persistence.
