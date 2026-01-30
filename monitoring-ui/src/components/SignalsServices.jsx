export default function SignalsServices({ incident }) {
    if (!incident) return null;

    const signals = incident.signals || [];
    const services = incident.services || [];

    return (
        <div className="signals-services-section">
            <div className="signals-services-grid">
                <div className="signals-box">
                    <h3>Signals</h3>
                    {signals.length === 0 ? (
                        <p className="empty-state">No signals detected</p>
                    ) : (
                        <ul className="item-list">
                            {signals.map((signal, idx) => (
                                <li key={idx} className="signal-item">
                                    {signal}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="services-box">
                    <h3>Affected Services</h3>
                    {services.length === 0 ? (
                        <p className="empty-state">No services affected</p>
                    ) : (
                        <ul className="item-list">
                            {services.map((service, idx) => (
                                <li key={idx} className="service-item">
                                    {service}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
