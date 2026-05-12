package com.cropyield.backend.service;

import com.cropyield.backend.dto.PredictionRequest;
import com.cropyield.backend.entity.Prediction;
import com.cropyield.backend.repository.PredictionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class PredictionService {

    private final PredictionRepository repository;
    private final RestTemplate restTemplate;

    
    @Value("${ml.service.url}")
    private String mlServiceUrl;

    public PredictionService(PredictionRepository repository) {
        this.repository = repository;
        this.restTemplate = new RestTemplate();
    }

    public Prediction getPrediction(PredictionRequest request) {
        // Call ML Service
        String url = mlServiceUrl + "/predict";

        // Response structure from ML: { "predicted_yield": ..., "risk_score": ...,
        // "profit_estimation": ..., "explanation": ... }
        Map<String, Object> mlResponse = restTemplate.postForObject(url, request, Map.class);

        Prediction prediction = new Prediction();
        prediction.setRegion(request.getRegion());
        prediction.setCrop(request.getCrop());
        prediction.setSeason(request.getSeason());
        prediction.setSoilType(request.getSoilType());
        prediction.setTemperature(request.getTemperature());
        prediction.setHumidity(request.getHumidity());
        prediction.setRainfall(request.getRainfall());

        if (mlResponse != null) {
            prediction.setPredictedYield(((Number) mlResponse.get("predicted_yield")).doubleValue());
            prediction.setRiskScore(((Number) mlResponse.get("risk_score")).doubleValue());
            prediction.setProfitEstimation(((Number) mlResponse.get("profit_estimation")).doubleValue());
            prediction.setExplanation(mlResponse.get("explanation").toString());

            // Store SHAP values as a simple string representation or JSON if using a
            // library like Jackson
            prediction.setShapValues(mlResponse.get("shap_values").toString());
        }

        return repository.save(prediction);
    }

    public java.util.List<Prediction> getAllPredictions() {
        return repository.findByOrderByCreatedAtDesc();
    }
}
