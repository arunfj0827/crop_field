package com.cropyield.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String region;
    private String crop;
    private String season;
    private String soilType;

    private Double temperature;
    private Double humidity;
    private Double rainfall;

    private Double predictedYield;
    private Double riskScore;
    private Double profitEstimation;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(columnDefinition = "TEXT")
    private String shapValues; // JSON string of SHAP values

    private LocalDateTime createdAt = LocalDateTime.now();
}
