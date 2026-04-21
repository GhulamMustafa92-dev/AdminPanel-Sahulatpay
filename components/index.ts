// ── Common components ─────────────────────────────────────────────────────────
export { PageHeader }    from "./common/PageHeader";
export { DataTable }     from "./common/DataTable";
export { FilterBar }     from "./common/FilterBar";
export { StatusBadge }   from "./common/StatusBadge";
export { StatCard }      from "./common/StatCard";
export { EmptyState }    from "./common/EmptyState";
export { LoadingState }  from "./common/LoadingState";
export { ExportButton }  from "./common/ExportButton";

// ── Security components ───────────────────────────────────────────────────────
export { RevealGuard }   from "./security/RevealGuard";

// ── Type re-exports ───────────────────────────────────────────────────────────
export type { PageHeaderProps }                  from "./common/PageHeader";
export type { TableColumn, PaginationState, DataTableProps } from "./common/DataTable";
export type { FilterTab, FilterBarProps }        from "./common/FilterBar";
export type { StatusBadgeProps }                 from "./common/StatusBadge";
export type { StatCardProps, StatTrend }         from "./common/StatCard";
export type { EmptyStateProps, EmptyStateAction } from "./common/EmptyState";
export type { LoadingStateProps }                from "./common/LoadingState";
export type { ExportButtonProps, ExportColumn }  from "./common/ExportButton";
export type { RevealGuardProps }                 from "./security/RevealGuard";
