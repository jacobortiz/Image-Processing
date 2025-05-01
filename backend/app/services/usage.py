from datetime import date, timedelta
from typing import List, Dict, Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.usage import UsageRecord
from app.schemas.usage import DailyUsage, UsageSummary


class UsageService:
    """Service for tracking and retrieving usage data."""

    @staticmethod
    def record_usage(
        db: Session,
        user_id: int,
        process_type: str,
    ) -> None:
        """Record usage of a specific process type."""
        today = date.today()
        
        # Check if there's already a record for today and this process type
        record = db.query(UsageRecord).filter(
            UsageRecord.user_id == user_id,
            UsageRecord.date == today,
            UsageRecord.process_type == process_type,
        ).first()
        
        if record:
            # Update existing record
            record.count += 1
        else:
            # Create new record
            record = UsageRecord(
                user_id=user_id,
                date=today,
                process_type=process_type,
                count=1,
            )
            db.add(record)
            
        db.commit()

    @staticmethod
    def get_usage_summary(
        db: Session,
        user_id: int,
        days: int = 30,
    ) -> UsageSummary:
        """Get a summary of usage for the specified user."""
        # Calculate date range
        end_date = date.today()
        start_date = end_date - timedelta(days=days-1)  # Include today, so -1
        
        # Query for records in date range
        records = db.query(UsageRecord).filter(
            UsageRecord.user_id == user_id,
            UsageRecord.date >= start_date,
            UsageRecord.date <= end_date,
        ).all()
        
        # Create a mapping of date -> {resize_count, ocr_count}
        daily_usage_map: Dict[date, Dict[str, int]] = {}
        
        # Initialize all dates in range with zero counts
        current_date = start_date
        while current_date <= end_date:
            daily_usage_map[current_date] = {"resize_count": 0, "ocr_count": 0}
            current_date += timedelta(days=1)
        
        # Fill in actual counts
        total_resize = 0
        total_ocr = 0
        
        for record in records:
            if record.process_type == "resize":
                daily_usage_map[record.date]["resize_count"] = record.count
                total_resize += record.count
            elif record.process_type == "ocr":
                daily_usage_map[record.date]["ocr_count"] = record.count
                total_ocr += record.count
        
        # Convert to list of DailyUsage objects
        daily_usage = [
            DailyUsage(
                date=d,
                resize_count=counts["resize_count"],
                ocr_count=counts["ocr_count"],
            )
            for d, counts in sorted(daily_usage_map.items())
        ]
        
        return UsageSummary(
            total_resize=total_resize,
            total_ocr=total_ocr,
            daily_usage=daily_usage,
        )


# Create a singleton instance
usage_service = UsageService() 