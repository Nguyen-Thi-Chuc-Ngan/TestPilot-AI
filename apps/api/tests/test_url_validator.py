import pytest
from services.url_validator import validate_scan_url


def test_valid_https_url():
    assert validate_scan_url("https://example.com") == "https://example.com"


def test_valid_http_url():
    assert validate_scan_url("http://example.com") == "http://example.com"


def test_blocks_localhost():
    with pytest.raises(ValueError, match="not allowed"):
        validate_scan_url("http://localhost:3000")


def test_blocks_127():
    with pytest.raises(ValueError, match="not allowed"):
        validate_scan_url("http://127.0.0.1")


def test_blocks_private_ip():
    with pytest.raises(ValueError, match="private IP"):
        validate_scan_url("http://192.168.1.1")


def test_blocks_file_scheme():
    with pytest.raises(ValueError, match="http"):
        validate_scan_url("file:///etc/passwd")


def test_blocks_javascript_scheme():
    with pytest.raises(ValueError, match="http"):
        validate_scan_url("javascript:alert(1)")


def test_blocks_aws_metadata():
    with pytest.raises(ValueError, match="not allowed"):
        validate_scan_url("http://169.254.169.254/latest/meta-data")


def test_url_too_long():
    with pytest.raises(ValueError, match="too long"):
        validate_scan_url("https://example.com/" + "a" * 2048)
