"""Milvus filter expressions for knowledge ACL."""

from __future__ import annotations


def learning_filter_expr(branch_id: str, *, document_id: str | None = None) -> str:
    """Build LEARNING collection filter.

    Global docs are stored with ``branch_id == ""``. Callers with a branch
    include both their branch and globals. ADMIN (empty ``branch_id``) may
    fetch any document by ``document_id`` without a branch constraint; open
    retrieval without a branch is limited to globals.
    """
    if document_id is not None:
        if branch_id:
            return (
                f'(branch_id == "{branch_id}" or branch_id == "")'
                f' and document_id == "{document_id}"'
            )
        return f'document_id == "{document_id}"'
    if branch_id:
        return f'(branch_id == "{branch_id}" or branch_id == "")'
    return 'branch_id == ""'
