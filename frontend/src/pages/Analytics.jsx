import { useState } from 'react'
import { 
  Brain, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  Activity
} from 'lucide-react'
import { 
  useDelayPrediction, 
  useTrainModel, 
  useTrainingStatus, 
  useAnomalies, 
  useDataQuality 
} from '@/hooks/useAnalytics'

export default function Analytics() {
  const [predictionParams, setPredictionParams] = useState({
    route_id: '',
    hour: '',
    day_of_week: ''
  })

  // ML Model hooks
  const predictionParamsValid = predictionParams.route_id && predictionParams.hour && predictionParams.day_of_week
  const { data: prediction, isLoading: predictionLoading, error: predictionError } = useDelayPrediction(
    predictionParamsValid ? predictionParams : undefined
  )
  
  const { mutate: trainModel, isPending: training } = useTrainModel()
  const { data: trainingStatus } = useTrainingStatus()
  const { data: anomalies, isLoading: anomaliesLoading } = useAnomalies()
  const { data: dataQuality } = useDataQuality()

  const handleTrainModel = () => {
    trainModel()
  }

  const handlePredictionChange = (field, value) => {
    setPredictionParams(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getTrainingStatusIcon = () => {
    if (!trainingStatus) return <Brain size={20} className="text-gray-400" />
    
    switch (trainingStatus.status) {
      case 'training':
        return <Loader2 size={20} className="text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle size={20} className="text-green-500" />
      case 'failed':
        return <XCircle size={20} className="text-red-500" />
      default:
        return <Brain size={20} className="text-gray-400" />
    }
  }

  const getTrainingStatusColor = () => {
    if (!trainingStatus) return 'bg-gray-100 text-gray-800'
    
    switch (trainingStatus.status) {
      case 'training':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Machine learning models and predictive analytics</p>
        </div>
      </div>

      {/* ML Model Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Training */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">ML Model Training</h2>
            <div className="flex items-center gap-2">
              {getTrainingStatusIcon()}
              <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${getTrainingStatusColor()}`}>
                {trainingStatus?.status || 'idle'}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Train the delay prediction model with the latest transportation data.
            </p>
            
            {trainingStatus?.last_trained && (
              <div className="text-xs text-gray-500">
                Last trained: {new Date(trainingStatus.last_trained).toLocaleString()}
              </div>
            )}
            
            <button
              onClick={handleTrainModel}
              disabled={training || trainingStatus?.status === 'training'}
              className="btn btn-primary w-full"
            >
              {training ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Training Model...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Play size={16} />
                  Train Model
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Data Quality */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Data Quality</h2>
            <Activity size={20} className="text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {dataQuality ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completeness</span>
                  <span className="text-sm font-medium">{dataQuality.completeness || 'N/A'}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Accuracy</span>
                  <span className="text-sm font-medium">{dataQuality.accuracy || 'N/A'}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Records</span>
                  <span className="text-sm font-medium">{dataQuality.total_records?.toLocaleString() || 'N/A'}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Loading data quality metrics...</div>
            )}
          </div>
        </div>
      </div>

      {/* Delay Prediction */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Delay Prediction</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prediction Form */}
          <div className="space-y-4">
            <div>
              <label className="label">Route ID</label>
              <input
                type="text"
                value={predictionParams.route_id}
                onChange={(e) => handlePredictionChange('route_id', e.target.value)}
                className="input"
                placeholder="Enter route ID (e.g., R001)"
              />
            </div>
            
            <div>
              <label className="label">Hour (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={predictionParams.hour}
                onChange={(e) => handlePredictionChange('hour', e.target.value)}
                className="input"
                placeholder="Hour of day"
              />
            </div>
            
            <div>
              <label className="label">Day of Week</label>
              <select
                value={predictionParams.day_of_week}
                onChange={(e) => handlePredictionChange('day_of_week', e.target.value)}
                className="input"
              >
                <option value="">Select day</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="7">Sunday</option>
              </select>
            </div>
          </div>

          {/* Prediction Result */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Prediction Result</h3>
            
            {predictionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="text-gray-400 animate-spin" />
              </div>
            ) : predictionError ? (
              <div className="text-red-600 text-sm">
                Error: {predictionError.message}
              </div>
            ) : prediction ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Predicted Delay:</span>
                  <span className={`text-lg font-semibold ${
                    prediction.predicted_delay > 10 ? 'text-red-600' : 
                    prediction.predicted_delay > 5 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {prediction.predicted_delay?.toFixed(1)} minutes
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span className="text-sm font-medium">
                    {prediction.confidence?.toFixed(1)}%
                  </span>
                </div>
                
                {prediction.factors && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Key Factors:</div>
                    <div className="space-y-1">
                      {Object.entries(prediction.factors).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-gray-500">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm text-center py-8">
                Enter parameters to predict delay
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Anomaly Detection */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Anomaly Detection</h2>
          <AlertTriangle size={20} className="text-yellow-500" />
        </div>
        
        {anomaliesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="text-gray-400 animate-spin" />
          </div>
        ) : anomalies && anomalies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Route
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Detected
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {anomalies.map((anomaly, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm">{anomaly.route_id || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{anomaly.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {anomaly.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(anomaly.detected_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {anomaly.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No anomalies detected</p>
          </div>
        )}
      </div>
    </div>
  )
}
