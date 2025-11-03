"""
Data Schemas - Pydantic Models for Request/Response Validation

These schemas define the structure of API requests and responses for data operations.
Used by FastAPI for automatic validation and documentation.

USED BY:
- routes_data.py: Uses these schemas for request/response validation
- FastAPI automatically generates OpenAPI docs from these schemas

DEPENDS ON:
- Pydantic: For data validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any


class FileUploadResponse(BaseModel):
    """Response after successful file upload"""
    file_id: str = Field(..., description="Unique identifier for the uploaded file")
    metadata: Dict[str, Any] = Field(..., description="File metadata including columns, types, etc.")
    preview: List[Dict[str, Any]] = Field(..., description="Preview of first N rows")
    preview_row_count: int = Field(..., description="Number of rows in preview")


class VisualizationRequest(BaseModel):
    """Request body for creating a visualization"""
    file_id: str = Field(..., description="ID of the uploaded file")
    chart_type: str = Field(..., description="Type of chart: 'bar', 'pie', 'line', 'scatter'")
    x_axis: Optional[str] = Field(None, description="Column name for X-axis")
    y_axis: Optional[str] = Field(None, description="Column name for Y-axis")
    category_column: Optional[str] = Field(None, description="Column name for categories (pie charts)")
    value_column: Optional[str] = Field(None, description="Column name for values (pie charts)")
    aggregation: str = Field('sum', description="Aggregation method: 'sum', 'mean', 'count', 'min', 'max'")
    group_by: Optional[str] = Field(None, description="Column to group by for multi-series charts")
    filters: Optional[Dict[str, Any]] = Field(None, description="Filters to apply to data")


class VisualizationResponse(BaseModel):
    """Response containing visualization data"""
    chart_type: str = Field(..., description="Type of chart")
    data: Dict[str, Any] = Field(..., description="Chart data in ECharts format")
    summary: Optional[Dict[str, Any]] = Field(None, description="Summary statistics")


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")

