"""
Data API Routes - HTTP Endpoints for Excel Upload and Visualization

This file defines all REST API endpoints for data operations:
1. POST /api/data/upload - Upload Excel file
2. GET /api/data/preview/{file_id} - Get data preview
3. POST /api/data/visualize - Generate visualization data

DEPENDENCIES:
- FastAPI: For creating REST endpoints
- python-multipart: For file uploads

USED BY:
- main.py: Includes this router in the FastAPI app

DEPENDS ON:
- services/data_service.py: Uses process_excel_file(), get_file_metadata()
- services/dashboard_service.py: Uses prepare_visualization_data()
- models/schema_data.py: Uses schemas for request/response validation
- core/config.py: Uses settings for file size limits
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional
import os
import tempfile
import logging
from pathlib import Path

from app.services.data_service import process_excel_file, get_file_metadata, clear_cache
from app.services.dashboard_service import prepare_visualization_data
from app.models.schema_data import (
    FileUploadResponse,
    VisualizationRequest,
    VisualizationResponse,
    ErrorResponse
)
from app.core.config import settings

logger = logging.getLogger(__name__)

# Create router for data endpoints
router = APIRouter(prefix="/data", tags=["data"])


@router.post(
    "/upload",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Excel file",
    description="Upload an Excel file (.xlsx, .xls, .csv) for processing and visualization"
)
async def upload_excel_file(file: UploadFile = File(...)):
    """
    Upload and process an Excel file.
    
    This endpoint:
    1. Validates the file type and size
    2. Saves file temporarily
    3. Processes it using data_service.py
    4. Returns file_id and metadata
    
    USES:
    - data_service.py → process_excel_file() to parse and extract metadata
    
    RETURNS:
    - FileUploadResponse with file_id, metadata, and preview data
    """
    try:
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in settings.ALLOWED_EXCEL_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_EXCEL_EXTENSIONS)}"
            )
        
        # Check file size (Note: FastAPI's UploadFile may need size check in production)
        # For now, we'll rely on data_service error handling
        
        # Create upload directory if it doesn't exist
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(exist_ok=True)
        
        # Save uploaded file temporarily
        temp_file_path = None
        try:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=file_ext,
                dir=str(upload_dir)
            )
            temp_file_path = temp_file.name
            
            # Read and write file content
            content = await file.read()
            temp_file.write(content)
            temp_file.close()
            
            # Validate file size
            file_size = len(content)
            if file_size > settings.MAX_UPLOAD_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
                )
            
            # Process the file using data_service
            result = process_excel_file(temp_file_path)
            
            logger.info(f"Successfully processed file: {file.filename} -> {result['file_id']}")
            
            return FileUploadResponse(**result)
            
        finally:
            # Optionally delete temp file after processing (keep it for now if needed)
            # os.unlink(temp_file_path)
            pass
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process file: {str(e)}"
        )


@router.get(
    "/preview/{file_id}",
    summary="Get data preview",
    description="Get preview data and metadata for an uploaded file"
)
async def get_data_preview(file_id: str):
    """
    Get preview data for an uploaded file.
    
    This endpoint:
    1. Retrieves file metadata from cache
    2. Returns column information and sample data
    
    USES:
    - data_service.py → get_file_metadata() to get cached metadata
    
    RETURNS:
    - File metadata and preview data
    """
    try:
        metadata = get_file_metadata(file_id)
        
        if metadata is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File ID {file_id} not found. It may have expired or been cleared."
            )
        
        return {
            "file_id": file_id,
            "metadata": metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting preview: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get preview: {str(e)}"
        )


@router.post(
    "/visualize",
    response_model=VisualizationResponse,
    summary="Generate visualization data",
    description="Generate chart data based on user selections"
)
async def create_visualization(request: VisualizationRequest):
    """
    Generate visualization data for a chart.
    
    This endpoint:
    1. Validates the request parameters
    2. Retrieves cached DataFrame
    3. Processes data using dashboard_service
    4. Returns formatted chart data
    
    REQUEST BODY:
    - file_id: ID of uploaded file
    - chart_type: 'bar', 'pie', 'line', 'scatter'
    - x_axis, y_axis: Column names (for bar/line/scatter)
    - category_column, value_column: Column names (for pie)
    - aggregation: 'sum', 'mean', 'count', etc.
    - group_by: Optional grouping column
    - filters: Optional filters
    
    USES:
    - dashboard_service.py → prepare_visualization_data() to process and format data
    
    RETURNS:
    - VisualizationResponse with chart data in ECharts format
    """
    try:
        # Validate chart type and required parameters
        chart_type = request.chart_type.lower()
        
        if chart_type == 'pie':
            if not request.category_column or not request.value_column:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Pie chart requires category_column and value_column"
                )
        else:
            if not request.x_axis or not request.y_axis:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{chart_type.capitalize()} chart requires x_axis and y_axis"
                )
        
        # Prepare visualization data using dashboard_service
        chart_data = prepare_visualization_data(
            file_id=request.file_id,
            chart_type=chart_type,
            x_axis=request.x_axis,
            y_axis=request.y_axis,
            category_column=request.category_column,
            value_column=request.value_column,
            aggregation=request.aggregation,
            group_by=request.group_by,
            filters=request.filters
        )
        
        logger.info(f"Generated {chart_type} chart for file {request.file_id}")
        
        return VisualizationResponse(
            chart_type=chart_type,
            data=chart_data,
            summary=None  # Can add summary stats later
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating visualization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate visualization: {str(e)}"
        )


@router.delete(
    "/clear/{file_id}",
    summary="Clear cached file",
    description="Remove a file from the cache"
)
async def clear_cached_file(file_id: str):
    """
    Clear a specific file from cache.
    
    USES:
    - data_service.py → clear_cache() to remove cached data
    """
    try:
        clear_cache(file_id)
        return {"message": f"File {file_id} cleared from cache"}
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )

