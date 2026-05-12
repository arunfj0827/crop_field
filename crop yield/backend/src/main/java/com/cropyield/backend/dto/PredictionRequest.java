package com.cropyield.backend.dto;

import lombok.Data;

@Data
public class PredictionRequest {
    private String region;
    private String crop;
    private String season;
    @com.fasterxml.jackson.annotation.JsonAlias("soilType")
    @com.fasterxml.jackson.annotation.JsonProperty("soil_type")
    private String soilType;
    private Double temperature;
    private Double humidity;
    private Double rainfall;
}
