"""
Data Service - Excel File Processing and Metadata Extraction

This service handles:
1. Reading Excel files (.xlsx, .xls, .csv)
2. Data cleaning and type inference
3. Metadata extraction (column types, unique values, etc.)
4. Temporary data storage in memory

DEPENDENCIES:
- pandas: For reading and manipulating Excel files
- openpyxl: Excel file reading engine
- xlrd: Legacy Excel support

USED BY:
- routes_data.py: Calls process_excel_file() to handle uploads
- dashboard_service.py: May access cached data for visualization

DEPENDS ON:
- core/config.py: Uses settings for file size limits and upload directory
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from pathlib import Path
import uuid
from datetime import datetime
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory cache to store processed DataFrames
# Key: file_id (str), Value: dict with DataFrame and metadata
_data_cache: Dict[str, Dict[str, Any]] = {}


def infer_column_type(series: pd.Series) -> str:
    """
    Infer the data type of a pandas Series.
    
    Returns: 'numeric', 'categorical', 'datetime', or 'text'
    """
    # Check if it's datetime
    if pd.api.types.is_datetime64_any_dtype(series):
        return 'datetime'
    
    # Check if it's numeric
    if pd.api.types.is_numeric_dtype(series):
        # If it has few unique values relative to length, might be categorical
        unique_ratio = series.nunique() / len(series) if len(series) > 0 else 0
        if unique_ratio < 0.1 and series.nunique() < 50:
            return 'categorical'
        return 'numeric'
    
    # Check if it's boolean
    if pd.api.types.is_bool_dtype(series):
        return 'categorical'
    
    # Check if string column has few unique values (categorical)
    unique_ratio = series.nunique() / len(series) if len(series) > 0 else 0
    if unique_ratio < 0.3 and series.nunique() < 100:
        return 'categorical'
    
    # Default to text
    return 'text'


def extract_column_metadata(df: pd.DataFrame, column: str) -> Dict[str, Any]:
    """
    Extract metadata for a specific column.
    
    Returns: dict with type, unique_count, sample_values, etc.
    """
    series = df[column]
    col_type = infer_column_type(series)
    
    metadata = {
        'name': column,
        'type': col_type,
        'unique_count': int(series.nunique()),
        'null_count': int(series.isnull().sum()),
        'null_percentage': float((series.isnull().sum() / len(series)) * 100) if len(series) > 0 else 0,
    }
    
    # Add type-specific metadata
    if col_type == 'numeric':
        metadata['min'] = float(series.min()) if not series.empty else None
        metadata['max'] = float(series.max()) if not series.empty else None
        metadata['mean'] = float(series.mean()) if not series.empty else None
        metadata['std'] = float(series.std()) if not series.empty else None
    elif col_type == 'categorical':
        # Get top 10 most frequent values
        value_counts = series.value_counts().head(10)
        metadata['top_values'] = value_counts.to_dict()
        metadata['value_counts'] = {str(k): int(v) for k, v in value_counts.items()}
    elif col_type == 'datetime':
        metadata['min_date'] = str(series.min()) if not series.empty else None
        metadata['max_date'] = str(series.max()) if not series.empty else None
    
    return metadata


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean the DataFrame by removing empty rows/columns and handling common issues.
    
    Returns: Cleaned DataFrame
    """
    # Remove completely empty rows
    df = df.dropna(how='all')
    
    # Remove completely empty columns
    df = df.dropna(axis=1, how='all')
    
    # Reset index after cleaning
    df = df.reset_index(drop=True)
    
    # Strip whitespace from string columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.strip()
        # Replace empty strings with NaN
        df[col] = df[col].replace('', np.nan)
    
    return df


def process_excel_file(file_path: str, file_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Main function to process an uploaded Excel file.
    
    This function:
    1. Reads the Excel file using pandas
    2. Cleans the data
    3. Infers column types
    4. Extracts metadata
    5. Stores in cache
    
    Args:
        file_path: Path to the uploaded Excel file
        file_id: Optional file ID (generates UUID if not provided)
    
    Returns:
        dict with file_id, metadata, and preview data
        
    Raises:
        ValueError: If file cannot be processed
    """
    try:
        # Generate file ID if not provided
        if not file_id:
            file_id = str(uuid.uuid4())
        
        # Decide reader based on file extension and content; try robust fallbacks
        suffix = Path(file_path).suffix.lower()

        def try_read_csv(path: str):
            # Robust CSV read: auto-detect delimiter, handle BOM, skip bad lines
            return pd.read_csv(
                path,
                sep=None,
                engine='python',
                encoding='utf-8-sig',
                on_bad_lines='skip'
            )

        # Sniff magic bytes to differentiate xlsx (zip) vs text
        try:
            with open(file_path, 'rb') as fh:
                magic = fh.read(4)
        except Exception:
            magic = b''

        is_zip_like = magic.startswith(b'PK')  # .xlsx files are zip archives

        try:
            if suffix == '.csv' and not is_zip_like:
                df = try_read_csv(file_path)
                sheet_names = ['csv']
            elif suffix == '.xlsx' or is_zip_like:
                # Prefer openpyxl for .xlsx
                excel_file = pd.ExcelFile(file_path, engine='openpyxl')
                sheet_names = excel_file.sheet_names
                df = pd.read_excel(file_path, sheet_name=sheet_names[0], engine='openpyxl')
            elif suffix == '.xls':
                # Legacy Excel
                excel_file = pd.ExcelFile(file_path, engine='xlrd')
                sheet_names = excel_file.sheet_names
                df = pd.read_excel(file_path, sheet_name=sheet_names[0], engine='xlrd')
            else:
                # Unknown extension: attempt CSV first, then openpyxl
                try:
                    df = try_read_csv(file_path)
                    sheet_names = ['csv']
                except Exception:
                    excel_file = pd.ExcelFile(file_path, engine='openpyxl')
                    sheet_names = excel_file.sheet_names
                    df = pd.read_excel(file_path, sheet_name=sheet_names[0], engine='openpyxl')
        except ValueError as eng_err:
            # Engine selection issues: try alternative engines or CSV fallback
            try:
                excel_file = pd.ExcelFile(file_path, engine='xlrd')
                sheet_names = excel_file.sheet_names
                df = pd.read_excel(file_path, sheet_name=sheet_names[0], engine='xlrd')
            except Exception:
                # Final fallback to CSV parsing
                df = try_read_csv(file_path)
                sheet_names = ['csv']
        except Exception as read_err:
            # Final defensive fallback to CSV
            try:
                df = try_read_csv(file_path)
                sheet_names = ['csv']
            except Exception:
                raise
        
        logger.info(f"Loaded {len(df)} rows and {len(df.columns)} columns from {file_path}")
        
        # Clean the dataframe
        df = clean_dataframe(df)
        
        if df.empty:
            raise ValueError("Excel file is empty or contains no valid data")
        
        # Extract column metadata
        column_metadata = []
        for col in df.columns:
            metadata = extract_column_metadata(df, col)
            column_metadata.append(metadata)
        
        # Get preview data (first N rows)
        preview_rows = min(settings.MAX_DATA_ROWS_PREVIEW, len(df))
        preview_data = df.head(preview_rows).to_dict(orient='records')
        
        # Prepare summary
        summary = {
            'total_rows': int(len(df)),
            'total_columns': int(len(df.columns)),
            'sheet_name': sheet_names[0],
            'available_sheets': sheet_names,
            'columns': column_metadata,
            'processed_at': datetime.now().isoformat(),
        }
        
        # Store in cache
        _data_cache[file_id] = {
            'dataframe': df,
            'metadata': summary,
            'file_path': file_path,
            'created_at': datetime.now(),
        }
        
        logger.info(f"Processed file {file_id} with {len(df)} rows")
        
        return {
            'file_id': file_id,
            'metadata': summary,
            'preview': preview_data,
            'preview_row_count': preview_rows,
        }
        
    except Exception as e:
        logger.error(f"Error processing Excel file: {str(e)}")
        raise ValueError(f"Failed to process Excel file: {str(e)}")


def get_cached_dataframe(file_id: str) -> Optional[pd.DataFrame]:
    """
    Retrieve a cached DataFrame by file_id.
    
    Used by: dashboard_service.py to get data for visualization
    
    Returns: DataFrame if found, None otherwise
    """
    if file_id in _data_cache:
        return _data_cache[file_id]['dataframe']
    return None


def get_file_metadata(file_id: str) -> Optional[Dict[str, Any]]:
    """
    Get metadata for a processed file.
    
    Used by: routes_data.py for preview endpoint
    
    Returns: Metadata dict if found, None otherwise
    """
    if file_id in _data_cache:
        return _data_cache[file_id]['metadata']
    return None


def clear_cache(file_id: Optional[str] = None):
    """
    Clear cached data.
    
    Args:
        file_id: If provided, clears only that file. Otherwise clears all.
    """
    if file_id:
        if file_id in _data_cache:
            del _data_cache[file_id]
            logger.info(f"Cleared cache for file {file_id}")
    else:
        _data_cache.clear()
        logger.info("Cleared all cached data")

