"""
Dashboard Service - Visualization Data Processing

This service handles:
1. Processing visualization requests from frontend
2. Filtering, grouping, and aggregating data
3. Formatting data for chart libraries (ECharts format)
4. Supporting different chart types (bar, pie, line, scatter, etc.)

DEPENDENCIES:
- pandas: For data manipulation and aggregation

USED BY:
- routes_data.py: Calls prepare_visualization_data() to process chart requests

DEPENDS ON:
- data_service.py: Uses get_cached_dataframe() to retrieve processed data
- core/config.py: Uses settings if needed
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from app.services.data_service import get_cached_dataframe
import logging

logger = logging.getLogger(__name__)


def aggregate_data(df: pd.DataFrame, column: str, aggregation: str) -> pd.Series:
    """
    Aggregate a column based on the aggregation type.
    
    Args:
        df: DataFrame to aggregate
        column: Column name to aggregate
        aggregation: Type of aggregation ('sum', 'mean', 'count', 'min', 'max', 'median')
    
    Returns: Aggregated Series
    """
    aggregation_map = {
        'sum': 'sum',
        'mean': 'mean',
        'average': 'mean',
        'count': 'count',
        'min': 'min',
        'max': 'max',
        'median': 'median',
    }
    
    agg_func = aggregation_map.get(aggregation.lower(), 'sum')
    
    if agg_func == 'count':
        return df[column].count()
    else:
        return getattr(df[column], agg_func)()


def prepare_bar_chart_data(
    df: pd.DataFrame,
    x_axis: str,
    y_axis: str,
    aggregation: str = 'sum',
    group_by: Optional[str] = None,
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Prepare data for bar chart visualization.
    
    Format: { categories: [...], series: [{ name: 'Series1', data: [...] }] }
    
    Used by: routes_data.py → prepare_visualization_data()
    """
    # Apply filters if provided
    filtered_df = apply_filters(df, filters) if filters else df.copy()
    
    if group_by:
        # Grouped bar chart (multiple series)
        grouped = filtered_df.groupby([x_axis, group_by])
        aggregated = grouped[y_axis].agg(aggregation)
        
        # Get unique categories and groups
        categories = sorted(filtered_df[x_axis].unique().tolist())
        groups = sorted(filtered_df[group_by].unique().tolist())
        
        # Create series data for each group
        series = []
        for group in groups:
            series_data = []
            for cat in categories:
                value = aggregated.get((cat, group), 0)
                series_data.append(float(value) if pd.notna(value) else 0)
            series.append({
                'name': str(group),
                'data': series_data,
                'type': 'bar'
            })
        
        return {
            'categories': [str(c) for c in categories],
            'series': series,
            'chart_type': 'bar'
        }
    else:
        # Simple bar chart (single series)
        grouped = filtered_df.groupby(x_axis)
        aggregated = grouped[y_axis].agg(aggregation)
        
        categories = [str(c) for c in aggregated.index.tolist()]
        values = [float(v) if pd.notna(v) else 0 for v in aggregated.values]
        
        return {
            'categories': categories,
            'series': [{
                'name': y_axis,
                'data': values,
                'type': 'bar'
            }],
            'chart_type': 'bar'
        }


def prepare_pie_chart_data(
    df: pd.DataFrame,
    category_column: str,
    value_column: str,
    aggregation: str = 'sum',
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Prepare data for pie chart visualization.
    
    Format: { data: [{ name: 'Cat1', value: 100 }, ...] }
    
    Used by: routes_data.py → prepare_visualization_data()
    """
    filtered_df = apply_filters(df, filters) if filters else df.copy()
    
    grouped = filtered_df.groupby(category_column)
    aggregated = grouped[value_column].agg(aggregation)
    
    data = [
        {
            'name': str(name),
            'value': float(value) if pd.notna(value) else 0
        }
        for name, value in aggregated.items()
    ]
    
    return {
        'data': data,
        'chart_type': 'pie'
    }


def prepare_line_chart_data(
    df: pd.DataFrame,
    x_axis: str,
    y_axis: str,
    aggregation: str = 'sum',
    group_by: Optional[str] = None,
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Prepare data for line chart visualization.
    
    Format: { categories: [...], series: [{ name: 'Series1', data: [...] }] }
    
    Used by: routes_data.py → prepare_visualization_data()
    """
    filtered_df = apply_filters(df, filters) if filters else df.copy()
    
    if group_by:
        # Multiple series
        grouped = filtered_df.groupby([x_axis, group_by])
        aggregated = grouped[y_axis].agg(aggregation)
        
        categories = sorted(filtered_df[x_axis].unique().tolist())
        groups = sorted(filtered_df[group_by].unique().tolist())
        
        series = []
        for group in groups:
            series_data = []
            for cat in categories:
                value = aggregated.get((cat, group), 0)
                series_data.append(float(value) if pd.notna(value) else 0)
            series.append({
                'name': str(group),
                'data': series_data,
                'type': 'line'
            })
        
        return {
            'categories': [str(c) for c in categories],
            'series': series,
            'chart_type': 'line'
        }
    else:
        # Single series
        grouped = filtered_df.groupby(x_axis)
        aggregated = grouped[y_axis].agg(aggregation)
        
        categories = [str(c) for c in aggregated.index.tolist()]
        values = [float(v) if pd.notna(v) else 0 for v in aggregated.values]
        
        return {
            'categories': categories,
            'series': [{
                'name': y_axis,
                'data': values,
                'type': 'line'
            }],
            'chart_type': 'line'
        }


def prepare_scatter_chart_data(
    df: pd.DataFrame,
    x_axis: str,
    y_axis: str,
    group_by: Optional[str] = None,
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Prepare data for scatter plot visualization.
    
    Format: { series: [{ name: 'Series1', data: [[x, y], ...] }] }
    
    Used by: routes_data.py → prepare_visualization_data()
    """
    filtered_df = apply_filters(df, filters) if filters else df.copy()
    
    if group_by:
        # Multiple series by group
        groups = sorted(filtered_df[group_by].unique().tolist())
        series = []
        
        for group in groups:
            group_df = filtered_df[filtered_df[group_by] == group]
            data_points = [
                [
                    float(group_df.iloc[i][x_axis]) if pd.notna(group_df.iloc[i][x_axis]) else 0,
                    float(group_df.iloc[i][y_axis]) if pd.notna(group_df.iloc[i][y_axis]) else 0
                ]
                for i in range(len(group_df))
            ]
            series.append({
                'name': str(group),
                'data': data_points,
                'type': 'scatter'
            })
        
        return {
            'series': series,
            'chart_type': 'scatter'
        }
    else:
        # Single series
        data_points = [
            [
                float(filtered_df.iloc[i][x_axis]) if pd.notna(filtered_df.iloc[i][x_axis]) else 0,
                float(filtered_df.iloc[i][y_axis]) if pd.notna(filtered_df.iloc[i][y_axis]) else 0
            ]
            for i in range(len(filtered_df))
        ]
        
        return {
            'series': [{
                'name': 'Data',
                'data': data_points,
                'type': 'scatter'
            }],
            'chart_type': 'scatter'
        }


def apply_filters(df: pd.DataFrame, filters: Dict[str, Any]) -> pd.DataFrame:
    """
    Apply filters to DataFrame.
    
    Filters format:
    {
        'column_name': {
            'type': 'range' | 'equals' | 'in',
            'value': ...,
            'min': ...,  # for range
            'max': ...   # for range
        }
    }
    """
    filtered_df = df.copy()
    
    for column, filter_config in filters.items():
        if column not in filtered_df.columns:
            continue
        
        filter_type = filter_config.get('type', 'equals')
        
        if filter_type == 'range':
            min_val = filter_config.get('min')
            max_val = filter_config.get('max')
            if min_val is not None:
                filtered_df = filtered_df[filtered_df[column] >= min_val]
            if max_val is not None:
                filtered_df = filtered_df[filtered_df[column] <= max_val]
        
        elif filter_type == 'equals':
            value = filter_config.get('value')
            if value is not None:
                filtered_df = filtered_df[filtered_df[column] == value]
        
        elif filter_type == 'in':
            values = filter_config.get('value', [])
            if values:
                filtered_df = filtered_df[filtered_df[column].isin(values)]
    
    return filtered_df


def prepare_visualization_data(
    file_id: str,
    chart_type: str,
    x_axis: Optional[str] = None,
    y_axis: Optional[str] = None,
    category_column: Optional[str] = None,
    value_column: Optional[str] = None,
    aggregation: str = 'sum',
    group_by: Optional[str] = None,
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Main function to prepare visualization data based on chart type and parameters.
    
    This is the main entry point called by routes_data.py
    
    Args:
        file_id: ID of the processed file (from data_service cache)
        chart_type: Type of chart ('bar', 'pie', 'line', 'scatter', etc.)
        x_axis: Column name for X-axis
        y_axis: Column name for Y-axis
        category_column: Column name for categories (pie charts)
        value_column: Column name for values (pie charts)
        aggregation: Aggregation method ('sum', 'mean', 'count', etc.)
        group_by: Optional column to group by (for multi-series charts)
        filters: Optional filters to apply
    
    Returns:
        Formatted data ready for ECharts or other chart libraries
        
    Raises:
        ValueError: If file_id not found or invalid parameters
    """
    # Get cached DataFrame
    df = get_cached_dataframe(file_id)
    if df is None:
        raise ValueError(f"File ID {file_id} not found in cache")
    
    # Validate required columns based on chart type
    chart_type = chart_type.lower()
    
    if chart_type == 'bar':
        if not x_axis or not y_axis:
            raise ValueError("Bar chart requires x_axis and y_axis")
        return prepare_bar_chart_data(df, x_axis, y_axis, aggregation, group_by, filters)
    
    elif chart_type == 'pie':
        if not category_column or not value_column:
            raise ValueError("Pie chart requires category_column and value_column")
        return prepare_pie_chart_data(df, category_column, value_column, aggregation, filters)
    
    elif chart_type == 'line':
        if not x_axis or not y_axis:
            raise ValueError("Line chart requires x_axis and y_axis")
        return prepare_line_chart_data(df, x_axis, y_axis, aggregation, group_by, filters)
    
    elif chart_type == 'scatter':
        if not x_axis or not y_axis:
            raise ValueError("Scatter chart requires x_axis and y_axis")
        return prepare_scatter_chart_data(df, x_axis, y_axis, group_by, filters)
    
    else:
        raise ValueError(f"Unsupported chart type: {chart_type}")

