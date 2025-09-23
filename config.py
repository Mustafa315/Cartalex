# Terracotta configuration file to connect to PostGIS raster tables

from terracotta.config import (
    TerracottaSettings,
    PostgresqlDriverOptions
)

# Define the connection to your PostGIS database
POSTGRES_OPTIONS = PostgresqlDriverOptions(
    url="postgresql://postgres:postgres@db:5432/cartalex_basileia_3857"
)

# Define the settings for the Terracotta server
SETTINGS = TerracottaSettings(
    # Tell Terracotta to use the PostGIS driver
    DRIVERS=["postgresql"],
    # Provide the connection options
    POSTGRESQL_DRIVER_OPTIONS=POSTGRES_OPTIONS,
    # Set a default resampler for better image quality when zooming
    RESAMPLING_METHOD="bilinear"
)