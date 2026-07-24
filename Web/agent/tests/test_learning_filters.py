"""Unit tests for LEARNING Milvus filter expressions."""

from __future__ import annotations

from app.rag.filters import learning_filter_expr


def test_learning_filter_includes_branch_and_global():
    expr = learning_filter_expr("1")
    assert 'branch_id == "1"' in expr
    assert 'branch_id == ""' in expr
    assert " or " in expr


def test_learning_filter_empty_branch_is_global_only():
    assert learning_filter_expr("") == 'branch_id == ""'


def test_learning_document_filter_with_branch_includes_global():
    expr = learning_filter_expr("1", document_id="42")
    assert 'document_id == "42"' in expr
    assert 'branch_id == "1"' in expr
    assert 'branch_id == ""' in expr


def test_learning_document_filter_admin_empty_branch_by_document_only():
    assert learning_filter_expr("", document_id="42") == 'document_id == "42"'
